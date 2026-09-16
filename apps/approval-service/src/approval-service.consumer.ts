import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ApprovalServiceService } from './approval-service.service';
import {
  CANCEL_APPROVAL_MESSAGE,
  SEND_APPROVAL_MESSAGE,
} from '@app/commons/enums/approval/approval_saveDBmessage.enum';
import { approval_request_saveDB_dto } from '@app/commons/dto/aprovaldto/approval_request_saveDB.dto';
import { CancelApprovalPayloadDto } from '@app/commons/dto/aprovaldto/cancel_approval_payload.dto';

@Controller()
export class ApprovalServiceConsumer {
  constructor(
    private readonly approvalServiceService: ApprovalServiceService,
  ) {}

  @MessagePattern(SEND_APPROVAL_MESSAGE)
  async approvalrequest(@Payload() data: approval_request_saveDB_dto) {
    console.log('đến chỗ lưu db rồi nhé ', data);
    return this.approvalServiceService.approvalrequest(data);
  }

  @MessagePattern(CANCEL_APPROVAL_MESSAGE)
  async cancelApproval(@Payload() data: CancelApprovalPayloadDto) {
    return this.approvalServiceService.cancel_approval(
      data.id_req,
      data.user.email,
      data.reason,
    );
  }
}
