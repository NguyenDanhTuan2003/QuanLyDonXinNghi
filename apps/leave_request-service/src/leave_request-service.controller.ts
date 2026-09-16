import { Controller } from '@nestjs/common';
import { LeaveRequestServiceService } from './leave_request-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateLeaveRequestPayloadDto } from '@app/commons/dto/leave_requestdto/leave_payload.dto';
import { payloadleave_reqDto } from '@app/commons/dto/leave_requestdto/LeaveRequestQuery.dto';
import { Adminpayloadleave_reqDto } from '@app/commons/dto/leave_requestdto/Admin_leaverequestDto';
import { RejectLeaveRequestDto } from '@app/commons/dto/leave_requestdto/RejectLeaveRequest.dto';
import { leaveDetailDto } from '@app/commons/dto/leave_requestdto/leave_request_detail.dto';

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
  getLeaveRequestByUser(@Payload() payload: payloadleave_reqDto) {
    return this.leaveRequestServiceService.getLeaveRequestByUser(payload);
  }
  @MessagePattern('admin_leave_request.getall')
  getLeaveRequestByAdmin(
    @Payload() payload: Adminpayloadleave_reqDto,
  ): Promise<any> {
    return this.leaveRequestServiceService.getLeaveRequestByAdmin(payload);
  }
  @MessagePattern('leave_request.detail')
  getDetailLeaveRequest(@Payload() payload: leaveDetailDto) {
    return this.leaveRequestServiceService.getDetailLeaveRequest(payload);
  }
  @MessagePattern('leave_request.cancel')
  cancelLeaveRequest(@Payload() payload: RejectLeaveRequestDto) {
    return this.leaveRequestServiceService.cancelLeaveRequest(payload);
  }
}
