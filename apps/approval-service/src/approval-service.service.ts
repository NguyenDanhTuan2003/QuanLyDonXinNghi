import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Approval,
  ApprovalRequestDocument,
  ApprovalStatus,
} from './schemas/approval.schema';
import { IUser } from '@app/commons/interfaces/user.interface';

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
    // 1. Fetch thông tin hiện tại
    const existingRequest = await this.approvalRequestModel.findById(id).lean();
    if (!existingRequest) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_NOT_FOUND);
    }
    if (existingRequest.status !== ApprovalStatus.PENDING) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_ALREADY_PROCESSED);
    }

    // 2. ATOMIC UPDATE: Điểm mấu chốt chống Race Condition
    // Chỉ thực hiện update thành công NẾU đơn vẫn còn đang PENDING
    const data = await this.approvalRequestModel.findOneAndUpdate(
      {
        _id: id,
        status: ApprovalStatus.PENDING, // <-- Lock điều kiện: Ngăn request thứ 2 can thiệp
      },
      {
        status: status,
        processedBy: user.email,
      },
      { new: true, lean: true },
    );

    // Nếu data trả về null, nghĩa là trong khoảng tíc tắc giữa bước 1 và 2,
    // đã có một request khác đổi status của đơn này rồi.
    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.APPROVAL_ALREADY_PROCESSED);
    }

    // 3. Chuẩn bị dữ liệu Payload chung
    const update_data = {
      _id: data._id.toString(),
      id_req: data.id_req,
      processedBy: user.email,
      processAt: new Date(), // Lấy thời điểm hiện tại thay vì createdAt
      newData: data.newData,
      messageName: data.messageName,
      message: 'Đã duyệt đơn thành công',
      createdByemailName: data.createdByemailName,
    };

    // 4. Gửi NATS
    if (status === 'APPROVED') {
      const response_nats = await firstValueFrom<{
        message: string;
        success: boolean;
      }>(this.natsClient.send(data.messageName, update_data));

      return {
        ...update_data,
        message: response_nats,
      };
    }

    return {
      newData: data.newData,
      message: 'Đã xử lý đơn thành công',
    };
  }

  async getallaproval() {
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
      return {
        ...update_data,
        message: 'Đã từ chối đơn thành công',
      };
    }
  }
}
