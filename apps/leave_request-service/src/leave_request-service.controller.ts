import { Controller } from '@nestjs/common';
import { LeaveRequestServiceService } from './leave_request-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateLeaveRequestPayloadDto } from '@app/commons/dto/leave_requestdto/leave_payload.dto';
import { RejectLeaveRequestDto } from '@app/commons/dto/leave_requestdto/RejectLeaveRequest.dto';

@Controller()
export class LeaveRequestServiceController {
  constructor(
    private readonly leaveRequestServiceService: LeaveRequestServiceService,
  ) {}

  @MessagePattern('leave_request.create')
  createLeaveRequest(@Payload() payload: CreateLeaveRequestPayloadDto) {
    return this.leaveRequestServiceService.createLeaveRequest(payload);
  }
  @MessagePattern('leave_request.getall')
  getLeaveRequestByUser(
    @Payload('userId') userId: string,
    @Payload('query') query: string | Record<string, unknown>,
  ) {
    return this.leaveRequestServiceService.getLeaveRequestByUser(userId, query);
  }
  @MessagePattern('admin_leave_request.getall')
  getLeaveRequestByAdmin(
    @Payload('query') query: string | Record<string, unknown>,
  ): Promise<any> {
    return this.leaveRequestServiceService.getLeaveRequestByAdmin(query);
  }
  @MessagePattern('leave_request.detail')
  getDetailLeaveRequest(
    @Payload('userId') userId: string,
    @Payload('role') role: string,
    @Payload('requestId') requestId: string,
  ) {
    return this.leaveRequestServiceService.getDetailLeaveRequest(
      userId,
      role,
      requestId,
    );
  }
  @MessagePattern('leave_request.cancel')
  cancelLeaveRequest(@Payload() payload: RejectLeaveRequestDto) {
    return this.leaveRequestServiceService.cancelLeaveRequest(payload);
  }
}
