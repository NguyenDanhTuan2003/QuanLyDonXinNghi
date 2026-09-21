import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LeaveRequest,
  LeaveRequestDocument,
} from '../schemas/leave_request.schema';
import { CreateLeaveRequestPayloadDto } from '@app/commons/dto/leave_requestdto/leave_payload.dto';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';
import { list_messageName_enum } from '@app/commons/enums/approval/list_messageName.enum';
import {
  CANCEL_APPROVAL_MESSAGE,
  SEND_APPROVAL_MESSAGE,
} from '@app/commons/enums/approval/approval_saveDBmessage.enum';
import { payloadleave_reqDto } from '@app/commons/dto/leave_requestdto/LeaveRequestQuery.dto';
import { createRpcError } from '@app/commons/helpers/throw_nat_custom';
import { ALL_CUSTOM_RPC_ERRORS } from '@app/commons/enums/rpc/rpc_error.enum';
import { Adminpayloadleave_reqDto } from '@app/commons/dto/leave_requestdto/Admin_leaverequestDto';
import { ApprovalStatus } from '@app/commons/enums/approval/approval-status.enum';
import { UpdateNewDataDto } from '@app/commons/dto/aprovaldto/UpdateNewData.dto';
import { RejectLeaveRequestDto } from '@app/commons/dto/leave_requestdto/RejectLeaveRequest.dto';
import { firstValueFrom } from 'rxjs';
import { userDto } from '@app/commons/dto/userdto/user.dto';
import { leaveDetailDto } from '@app/commons/dto/leave_requestdto/leave_request_detail.dto';
import { CustomWinstonLogger } from '@app/commons';
type DateOperator = 'exact' | 'gte' | 'lte';

interface ParsedDate {
  dateValue: Date;
  operator: DateOperator;
}
@Injectable()
export class LeaveRequestServiceService implements OnModuleInit {
  // vì provide trong loggermodule được khai báo là 1 class nest hiểu được nên k cần @inject như redis
  // hàm onModuleInit chạy lần đầu khi app khởi động xong custom lại để nó chạy 2 hàm dưới cho nso quest db trc khi chạy app
  onModuleInit() {
    // Chạy định kỳ mỗi đêm lúc 00:00 (hoặc chạy mỗi 1 tiếng = 3600000ms để đảm bảo)
    // Để cho an toàn, ta dùng setInterval quét mỗi giờ một lần
    setInterval(() => {
      // Hàm này họ hàng của settimeout
      this.autoCancelExpiredRequests().catch((err) =>
        this.logger.error(
          'Lỗi khi chạy autoCancelExpiredRequests',
          err instanceof Error ? err.stack : String(err),
          LeaveRequestServiceService.name,
        ),
      );
    }, 3600000);
    // Chạy luôn lần đầu khi khởi động
    this.autoCancelExpiredRequests().catch((err) =>
      this.logger.error(
        'Lỗi khi chạy autoCancelExpiredRequests',
        err instanceof Error ? err.stack : String(err),
        LeaveRequestServiceService.name,
      ),
    );
  }

  constructor(
    private readonly logger: CustomWinstonLogger,
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    private readonly natsClient: CustomNatsClient,
  ) {}

  private formatMongoOperators(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};

    for (const key in obj) {
      const value = obj[key];

      if (value === undefined || value === null || value === '') continue;

      // Bỏ qua gt, lt
      if (['gt', 'lt'].includes(key)) continue;

      if (['gte', 'lte'].includes(key)) {
        const mongoKey = `$${key}`;
        if (typeof value === 'string') {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            formatted[mongoKey] = parsedDate;
          } else {
            formatted[mongoKey] = value;
          }
        } else {
          formatted[mongoKey] = value;
        }
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        formatted[key] = this.formatMongoOperators(
          value as Record<string, unknown>,
        );
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  }

  private extractDateParams(field: unknown): ParsedDate | null {
    if (!field) return null;

    let parsedField: unknown = field;
    // những obj lọc được query gửi lên đôi khi khá phức tạp thường là dạng json phải parse nó ra nếu lỗi thì nó là chuỗi ngày tháng ta sẽ đưa nó về chuẩn dạng ngày tháng
    if (typeof field === 'string') {
      try {
        parsedField = JSON.parse(field);
      } catch {
        const d = new Date(field);
        return !isNaN(d.getTime()) ? { dateValue: d, operator: 'exact' } : null;
      }
    }

    if (typeof parsedField === 'object' && !Array.isArray(parsedField)) {
      const obj = parsedField as Record<string, unknown>;
      if (typeof obj.gte === 'string') {
        const d = new Date(obj.gte);
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          return { dateValue: d, operator: 'gte' };
        }
      }
      if (typeof obj.lte === 'string') {
        const d = new Date(obj.lte);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          return { dateValue: d, operator: 'lte' };
        }
      }
      if (typeof obj.exact === 'string') {
        const d = new Date(obj.exact);
        if (!isNaN(d.getTime())) {
          return { dateValue: d, operator: 'exact' };
        }
      }
      if (typeof obj.eq === 'string') {
        const d = new Date(obj.eq);
        if (!isNaN(d.getTime())) {
          return { dateValue: d, operator: 'exact' };
        }
      }
    }
    return null;
  }

  private applyDateFilters(
    items: Record<string, unknown>,
    rawStartDate: unknown,
    rawEndDate: unknown,
  ): void {
    const startReq = this.extractDateParams(rawStartDate);
    const endReq = this.extractDateParams(rawEndDate);

    if (startReq && endReq) {
      if (
        new Date(startReq.dateValue).getTime() >=
        new Date(endReq.dateValue).getTime()
      ) {
        throw createRpcError(ALL_CUSTOM_RPC_ERRORS.BAD_REQUEST);
      }

      const startOp = startReq.operator;
      const endOp = endReq.operator;

      // 1. Chuẩn hóa Ngày A (startVal)
      const startDayStart = new Date(startReq.dateValue);
      startDayStart.setHours(0, 0, 0, 0); // 0h sáng
      const startDayEnd = new Date(startReq.dateValue);
      startDayEnd.setHours(23, 59, 59, 999); // 23h59 tối

      // 2. Chuẩn hóa Ngày B (endVal)
      const endDayStart = new Date(endReq.dateValue);
      endDayStart.setHours(0, 0, 0, 0);
      const endDayEnd = new Date(endReq.dateValue);
      endDayEnd.setHours(23, 59, 59, 999);

      if (startOp === 'exact' && endOp === 'exact') {
        items.$or = [
          {
            startDate: { $lte: startDayStart },
            endDate: { $gte: startDayEnd },
            // đơn nghỉ được tính theo 1 ngày trọn vẹn tức 24 tiếng tính từ 0h00 nên phải sét lte startDayEnd
          },
          { startDate: { $lte: endDayStart }, endDate: { $gte: endDayEnd } },
        ];
      } else if (startOp === 'gte' && endOp === 'gte') {
        items.endDate = { $gte: startDayEnd }; // vì đây mới được coi là nghỉ 1 ngày trọn vẹn
      } else if (startOp === 'lte' && endOp === 'lte') {
        items.startDate = { $lte: endDayStart };
      } else if (startOp === 'exact' && endOp === 'gte') {
        items.$or = [
          {
            startDate: { $lte: startDayStart },
            endDate: { $gte: startDayEnd },
          },
          { endDate: { $gte: endDayEnd } },
        ];
      } else if (startOp === 'exact' && endOp === 'lte') {
        items.$or = [
          {
            startDate: { $lte: startDayStart },
            endDate: { $gte: startDayEnd },
          },
          { startDate: { $lte: endDayEnd } },
        ];
      } else if (startOp === 'gte' && endOp === 'exact') {
        items.$or = [
          { startDate: { $lte: endDayStart }, endDate: { $gte: endDayEnd } },
          { endDate: { $gte: startDayEnd } },
        ];
      } else if (startOp === 'lte' && endOp === 'exact') {
        items.$or = [
          { startDate: { $lte: endDayStart }, endDate: { $gte: endDayEnd } },
          { startDate: { $lte: endDayStart } },
        ];
      } else if (startOp === 'gte' && endOp === 'lte') {
        items.startDate = { $lte: endDayStart };
        items.endDate = { $gte: startDayEnd };
      } else if (startOp === 'lte' && endOp === 'gte') {
        items.$or = [
          { endDate: { $gte: endDayEnd } },
          { startDate: { $lte: endDayStart } },
        ];
      }
    } else if (startReq) {
      const startDayStart = new Date(startReq.dateValue);
      startDayStart.setHours(0, 0, 0, 0);
      const startDayEnd = new Date(startReq.dateValue);
      startDayEnd.setHours(23, 59, 59, 999);

      if (startReq.operator === 'exact') {
        items.startDate = { $lte: startDayEnd };
        items.endDate = { $gte: startDayStart };
      } else if (startReq.operator === 'gte') {
        items.endDate = { $gte: startDayStart };
      } else if (startReq.operator === 'lte') {
        items.startDate = { $lte: startDayEnd };
      }
    } else if (endReq) {
      const endDayStart = new Date(endReq.dateValue);
      endDayStart.setHours(0, 0, 0, 0);
      const endDayEnd = new Date(endReq.dateValue);
      endDayEnd.setHours(23, 59, 59, 999);

      if (endReq.operator === 'exact') {
        items.startDate = { $lte: endDayEnd };
        items.endDate = { $gte: endDayStart };
      } else if (endReq.operator === 'gte') {
        items.endDate = { $gte: endDayStart };
      } else if (endReq.operator === 'lte') {
        items.startDate = { $lte: endDayEnd };
      }
    }
  }
  async createLeaveRequest(data: CreateLeaveRequestPayloadDto) {
    const { body, user } = data;
    const dataRequest = {
      ...body,
      userId: user._id,
    };
    if (new Date(body.startDate).getTime() > new Date(body.endDate).getTime()) {
      throw createRpcError(
        ALL_CUSTOM_RPC_ERRORS.LEAVE_REQUEST_INVALID_DATE_FILTER,
      );
    }
    // Đảm bảo không xét giờ phút giây để so sánh chính xác theo ngày
    const newStart = new Date(body.startDate);
    newStart.setHours(0, 0, 0, 0);
    const newEnd = new Date(body.endDate);
    newEnd.setHours(23, 59, 59, 999);

    const time_leave_req = await this.leaveRequestModel.findOne({
      userId: user._id,
      status: { $in: [ApprovalStatus.PENDING, ApprovalStatus.APPROVED] },
      startDate: {
        $lte: newEnd,
      },
      endDate: {
        $gte: newStart,
      },
    });

    if (time_leave_req) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.LEAVE_REQUEST_CONFLICT);
    }

    dataRequest.startDate = newStart;
    dataRequest.endDate = newEnd;

    const leaveRequest = new this.leaveRequestModel(dataRequest);

    await leaveRequest.save();
    return this.natsClient.send(SEND_APPROVAL_MESSAGE, {
      ...dataRequest,
      messageName: list_messageName_enum.leave_request,
      action: 'đơn xin nghỉ phép ',
      email: user.email,
      oldData: {
        status: ApprovalStatus.PENDING,
      },
      newData: {
        status: ApprovalStatus.APPROVED,
      },
      id_leave_req: leaveRequest._id,
    });
  }
  async getLeaveRequestByUser(payload: payloadleave_reqDto) {
    const filter = {
      userId: payload.userId,
      ...(payload.status !== undefined && {
        status: payload.status,
      }),
    };

    const totalCount = await this.leaveRequestModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / 10);

    const data = await this.leaveRequestModel
      .find(filter)
      .select(
        '_id userId startDate endDate reason status createdAt processedBy processedAt rejectReason',
      )
      .lean()
      .sort({ createdAt: payload.sortby === 'desc' ? -1 : 1 })
      .skip(((payload.page || 1) - 1) * 10)
      .limit(10);

    return {
      items: data,
      totalPages,
    };
  }
  async getLeaveRequestByAdmin(
    payload: Adminpayloadleave_reqDto,
  ): Promise<any> {
    // 1. Tách startDate và endDate ra khỏi các tham số khác
    const {
      requestid,
      page,
      sortby,
      email,
      role,
      startDate,
      endDate,
      ...otherOptions
    } = payload;
    void requestid;
    void email;
    void role;

    // 2. Format các bộ lọc bình thường (reason, status...) thông qua hàm private
    const items = this.formatMongoOperators(otherOptions);

    // 3. Ép logic đan chéo ngày tháng vào object `items`
    this.applyDateFilters(items, startDate, endDate);

    // DEBUG LOG
    console.log('Query items:', JSON.stringify(items, null, 2));

    const totalCount = await this.leaveRequestModel.countDocuments(items);
    const totalPages = Math.ceil(totalCount / 10);

    const data = await this.leaveRequestModel
      .find(items)
      .select(
        '_id userId startDate endDate reason status createdAt processedBy processedAt rejectReason',
      )
      .lean()
      .sort({ createdAt: sortby === 'desc' ? -1 : 1 })
      .skip(((page || 1) - 1) * 10)
      .limit(10);

    // <--- TỐI ƯU 2: Check mảng rỗng
    if (!data || data.length === 0) {
      return { items: [], totalPages: 0 };
    }

    // <--- TỐI ƯU 3: Dùng Set để lọc trùng ID & Định nghĩa kiểu cho kết quả trả về
    const uniqueUserIds = [
      ...new Set(data.map((item) => item.userId.toString())),
    ];
    const data_user = await firstValueFrom<userDto[]>(
      this.natsClient.send('users.get_batch', {
        userIds: uniqueUserIds,
      }),
    );

    // <--- TỐI ƯU 4: Dùng Map (Dictionary) để nối dữ liệu (O(1)) thay vì dùng .find lồng nhau (O(N^2))
    const userMap = new Map<string, userDto>();
    data_user.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const newData = data.map((item) => {
      return {
        ...item,
        user: userMap.get(item.userId.toString()) || null,
      };
    });

    return {
      items: newData,
      totalPages,
    };
  }

  async getDetailLeaveRequest(payload: leaveDetailDto) {
    const checkrole: {
      userId?: string;
    } = {};
    if (payload.role === 'USER') {
      checkrole.userId = payload._id;
    }
    const data = await this.leaveRequestModel.findOne({
      ...checkrole,
      _id: payload.requestid,
    });
    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.LEAVE_REQUEST_NOT_FOUND);
    }
    return data;
  }

  async approved_update_leave_request(payload: UpdateNewDataDto) {
    const { id_req, newData, processedBy, processAt, rejectReason } = payload;

    if (!id_req || !newData) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.BAD_REQUEST);
    }

    let dataToUpdate: Record<string, any> = {};

    if (typeof newData === 'string') {
      try {
        dataToUpdate = JSON.parse(newData) as Record<string, any>;
      } catch {
        throw createRpcError(ALL_CUSTOM_RPC_ERRORS.BAD_REQUEST);
      }
    } else {
      dataToUpdate = newData;
    }

    // Gán thêm thông tin người xử lý và thời gian xử lý
    if (processedBy) dataToUpdate.processedBy = processedBy;
    if (processAt) dataToUpdate.processedAt = processAt;
    if (rejectReason) dataToUpdate.rejectReason = rejectReason;

    const updatedLeaveReq = await this.leaveRequestModel.findByIdAndUpdate(
      id_req,
      { $set: dataToUpdate },
      { new: true, lean: true },
    );

    if (!updatedLeaveReq) {
      this.logger.warn(`Không tìm thấy đơn xin nghỉ với ID: ${id_req}`);
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.LEAVE_REQUEST_NOT_FOUND);
    }

    this.logger.log(
      `Cập nhật thành công đơn xin nghỉ ID: ${id_req} sang trạng thái: ${dataToUpdate.status}`,
    );

    return {
      success: true,
      message: 'Đồng bộ và cập nhật đơn xin nghỉ thành công!',
    };
  }
  async cancelLeaveRequest(payload: RejectLeaveRequestDto) {
    const data = await this.leaveRequestModel.findOneAndUpdate(
      {
        userId: payload.user._id,
        _id: payload.id_cancel,
        status: ApprovalStatus.PENDING,
      },
      {
        $set: { status: ApprovalStatus.CANCELLED },
      },
      { new: true, lean: true },
    );

    if (!data) {
      throw createRpcError(
        ALL_CUSTOM_RPC_ERRORS.LEAVE_REQUEST_ALREADY_PROCESSED,
      );
    }
    try {
      await firstValueFrom(
        this.natsClient.send(CANCEL_APPROVAL_MESSAGE, {
          id_req: payload.id_cancel,
          user: payload.user,
          reason: 'Người dùng đã tự hủy đơn xin nghỉ',
        }),
      );
    } catch (error) {
      console.error('Lỗi khi huỷ đơn xin nghỉ bên Approval Service:', error);
      // Rollback (Saga pattern) nếu bên approval thất bại
      await this.leaveRequestModel.findByIdAndUpdate(payload.id_cancel, {
        $set: { status: ApprovalStatus.PENDING },
      });
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      message: 'Đã hủy đơn xin nghỉ thành công!',
    };
  }

  //Hàm tự động gọi job sau 1 tiếng 1 lần
  private async autoCancelExpiredRequests() {
    this.logger.log(
      'Bắt đầu chạy Cron Job: Hủy tự động các đơn xin nghỉ quá hạn chưa duyệt.',
      LeaveRequestServiceService.name,
    );
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Đầu ngày hiện tại

    // Lấy các đơn PENDING và startDate < now vì ngày nghỉ đã đến nhưng chưa duyệt từ ngày bắt đầu nghỉ
    const expiredRequests = await this.leaveRequestModel.find({
      status: ApprovalStatus.PENDING,
      startDate: { $lt: now },
    });

    if (expiredRequests.length === 0) {
      this.logger.log(
        'Không có đơn xin nghỉ nào quá hạn cần hủy.',
        LeaveRequestServiceService.name,
      );
      return;
    }

    const cancelReason =
      'Hệ thống tự động hủy do đã qua ngày bắt đầu nghỉ mà chưa được duyệt';

    for (const req of expiredRequests) {
      // 1. Cập nhật trong DB Leave Request
      req.status = ApprovalStatus.CANCELLED;
      req.rejectReason = cancelReason;
      await req.save();

      // 2. Gửi lệnh hủy sang Approval Service
      try {
        await firstValueFrom(
          this.natsClient.send(CANCEL_APPROVAL_MESSAGE, {
            id_req: req._id.toString(),
            user: {
              _id: 'system',
              email: 'system@local',
              role: 'ADMIN',
              status: 'ACTIVE',
            },
            reason: cancelReason,
          }),
        );
        this.logger.log(
          `Đã hủy tự động đơn ${req._id.toString()}`,
          LeaveRequestServiceService.name,
        );
      } catch (error) {
        this.logger.error(
          `Lỗi khi gửi lệnh hủy tự động sang Approval Service cho đơn ${req._id.toString()}`,
          error instanceof Error ? error.stack : String(error),
          LeaveRequestServiceService.name,
        );
      }
    }

    this.logger.log(
      `Hoàn tất Cron Job: Đã hủy ${expiredRequests.length} đơn quá hạn.`,
      LeaveRequestServiceService.name,
    );
  }
}
