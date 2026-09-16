import { Controller } from '@nestjs/common';
import { LeaveRequestServiceService } from './leave_request-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { list_messageName_enum } from '@app/commons/enums/approval/list_messageName.enum';
import { UpdateNewDataDto } from '@app/commons/dto/aprovaldto/UpdateNewData.dto';

@Controller()
export class LeaveRequestServiceConsumer {
  constructor(
    private readonly leaveRequestServiceService: LeaveRequestServiceService,
  ) {}

  @MessagePattern(list_messageName_enum.leave_request)
  createLeaveRequest(@Payload() payload: UpdateNewDataDto) {
    return this.leaveRequestServiceService.approved_update_leave_request(
      payload,
    );
  }
}
