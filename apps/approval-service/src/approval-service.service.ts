import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Approval,
  ApprovalRequestDocument,
  ApprovalStatus,
} from './schemas/approval.schema';
import { IUser } from '@app/commons/interfaces/user.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createRpcError } from '@app/commons/helpers/throw_nat_custom';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';
import { approval_request_saveDB_dto } from '@app/commons/dto/aprovaldto/approval_request_saveDB.dto';
import { firstValueFrom } from 'rxjs';
import { ALL_CUSTOM_RPC_ERRORS } from '@app/commons/enums/rpc/rpc_error.enum';

@Injectable()
export class ApprovalServiceService {
  constructor(
    @InjectModel(Approval.name)
    private readonly approvalRequestModel: Model<ApprovalRequestDocument>,
    private readonly natsClient: CustomNatsClient,
    @InjectQueue('approval-expiration-queue')
    private approvalQueue: Queue,
  ) {}

  async approvalrequest(data: approval_request_saveDB_dto) {
    const savedb = {
      id_req: data.id_leave_req,
      requestName: data.action,
      expiresAt: data.expiresAt,
      status: ApprovalStatus.PENDING,
      createdByemailName: data.email,
      oldData: data.oldData,
      newData: data.newData,
      messageName: data.messageName,
    };
    await this.approvalRequestModel.create(savedb);

    return { message: 'Đang chờ phê duyệt' };
  }

  async approved_update(id: string, status: string, user: IUser) {
    // 1. Fetch thông tin hiện tại để tính toán logic ngày tháng (không dùng kết quả này để update)
    const existingRequest = await this.approvalRequestModel.findById(id).lean();
    if (!existingRequest) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_NOT_FOUND);
    }
    if (existingRequest.status !== ApprovalStatus.PENDING) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_ALREADY_PROCESSED);
    }

    let finalStatus = status;
    let rejectReason: string | undefined = undefined;
    let delay = 0;

    // 2. Tính toán expiration TRƯỚC khi chạm vào Database
    if (status === 'APPROVED' && existingRequest.expiresAt) {
      delay = new Date(existingRequest.expiresAt).getTime() - Date.now();

      // Nếu đã hết hạn, ta sẽ chủ động bẻ lái sang trạng thái CANCELLED
      if (delay <= 0) {
        finalStatus = ApprovalStatus.CANCELLED;
        rejectReason = 'Đơn hết hạn xác nhận';
      }
    }

    // 3. ATOMIC UPDATE: Điểm mấu chốt chống Race Condition
    // Chỉ thực hiện update thành công NẾU đơn vẫn còn đang PENDING
    const data = await this.approvalRequestModel.findOneAndUpdate(
      {
        _id: id,
        status: ApprovalStatus.PENDING, // <-- Lock điều kiện: Ngăn request thứ 2 can thiệp
      },
      {
        status: finalStatus,
        processedBy: user.email,
        ...(rejectReason ? { rejectReason } : {}),
      },
      { new: true, lean: true },
    );

    // Nếu data trả về null, nghĩa là trong khoảng tíc tắc giữa bước 1 và 3,
    // đã có một request khác đổi status của đơn này rồi.
    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_ALREADY_PROCESSED);
    }

    // 5. Chuẩn bị dữ liệu Payload chung
    const update_data = {
      _id: data._id.toString(),
      id_req: data.id_req,
      processedBy: user.email,
      processAt: new Date(), // Lấy thời điểm hiện tại thay vì createdAt
      newData: data.newData,
      messageName: data.messageName,
      expiresAt: data.expiresAt,
      rejectReason: rejectReason,
      message: 'Đã duyệt đơn thành công',
      createdByemailName: data.createdByemailName,
    };

    // 4. Nếu đơn rơi vào trường hợp hết hạn đã được xử lý phía trên
    if (finalStatus === 'CANCELLED') {
      update_data.newData = { status: 'CANCELLED' };
      update_data.message = 'Đơn đã bị hủy do hết hạn xác nhận';
      update_data.rejectReason = 'Đơn đã bị hủy do hết hạn xác nhận';

      // Bắn tin nhắn qua NATS để service gốc (leave_request) cập nhật lại trạng thái thành CANCELLED
      this.natsClient.emit(data.messageName, update_data);

      return {
        message: `Đơn duyệt này đã hết hạn từ ${data.expiresAt?.toString()} rồi admin không được duyệt nữa`,
      };
    }

    // 6. Gửi NATS hoặc nhét vào Redis Queue tùy theo việc có expiresAt hay không
    if (finalStatus === 'APPROVED') {
      if (!data.expiresAt) {
        const response_nats = await firstValueFrom<{
          message: string;
          success: boolean;
        }>(this.natsClient.send(data.messageName, update_data));

        return {
          ...update_data,
          message: response_nats,
        };
      } else {
        // Vì đã check delay <= 0 ở trên, xuống đến đây chắc chắn delay > 0
        const pull_response = await this.approvalQueue.add(
          'process-expiration',
          update_data, // Dữ liệu payload lưu trên Redis
          {
            attempts: 5, // Thử lại tối đa 5 lần
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            delay: delay,
            jobId: `approval-${data._id.toString()}`, // Tránh trùng lặp Job (Idempotent)
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        return {
          message: `Đã duyệt thành công và gửi yêu cầu sửa tới service "${data.messageName}" (Đơn ID: ${update_data._id})`,
          pull_response,
        };
      }
    }

    return {
      newData: data.newData,
      message: 'Đã xử lý đơn thành công',
    };
  }

  async getallaproval(user: IUser) {
    if (user.role !== 'ADMIN') {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_FORBIDDEN);
    }
    return this.approvalRequestModel.find({ status: ApprovalStatus.PENDING });
  }

  async cancel_approval(id_req: string, userEmail: string, reason?: string) {
    await this.approvalRequestModel.findOneAndUpdate(
      {
        id_req: id_req,
        status: ApprovalStatus.PENDING, // Chỉ hủy nếu đơn vẫn đang PENDING
      },
      {
        $set: {
          status: ApprovalStatus.CANCELLED,
          rejectReason: reason || 'Người dùng đã tự hủy / thu hồi yêu cầu',
          processedBy: userEmail,
          processAt: new Date(),
        },
      },
      { new: true, lean: true },
    );

    return {
      success: true,
      message: 'Đã hủy đơn duyệt thành công!',
    };
  }

  async reject_update(
    id: string,
    status: string,
    user: IUser,
    rejectReason: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_FORBIDDEN);
    }
    const check_status = await this.approvalRequestModel.findById(id);
    if (check_status?.status !== ApprovalStatus.PENDING) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_ALREADY_PROCESSED);
    }

    const data = await this.approvalRequestModel.findByIdAndUpdate(
      { _id: id },
      {
        status: status,
        rejectReason: rejectReason,
        processedBy: user.email,
        processAt: new Date(),
      },
      { new: true, lean: true },
    );

    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_NOT_FOUND);
    }

    const update_data = {
      id_req: data.id_req,
      status: status,
      processedBy: user.email,
      processAt: data.processAt,
      rejectReason: rejectReason,
    };

    if (status === 'REJECTED') {
      if (!data.expiresAt) {
        return {
          ...update_data,
          message: 'Đã từ chối đơn thành công',
        };
      } else {
        const delay = new Date(data.expiresAt).getTime() - Date.now();
        if (delay > 0) {
          return {
            ...update_data,
            message: 'Đã từ chối đơn còn hạn thành công',
          };
        } else {
          const reject_data = await this.approvalRequestModel.findByIdAndUpdate(
            { _id: id },
            {
              status: ApprovalStatus.CANCELLED,
              rejectReason: 'Đơn hết hạn xác nhận',
            },
            { new: true, lean: true },
          );

          update_data.status = ApprovalStatus.CANCELLED;
          update_data.rejectReason = 'Đơn hết hạn xác nhận';
          // Bắn sự kiện CANCELLED về Service gốc
          this.natsClient.emit(data.messageName, {
            ...update_data,
            newData: { status: 'CANCELLED' },
          });

          return {
            ...reject_data,
            message: 'Đơn này hết hạn rồi admin không duyệt nữa',
          };
        }
      }
    }
  }
}
