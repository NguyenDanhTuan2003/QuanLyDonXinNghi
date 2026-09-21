import { Controller } from '@nestjs/common';
import { ApprovalServiceService } from './approval-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminApprovePayloadDto } from '@app/commons/dto/aprovaldto/admin_approve_payload.dto';
import { AdminRejectPayloadDto } from '@app/commons/dto/aprovaldto/admin_reject_payload.dto';

@Controller('admin')
export class ApprovalServiceController {
  constructor(
    private readonly approvalServiceService: ApprovalServiceService,
  ) {}

  @MessagePattern('admin.approve.request')
  async approveMessage(@Payload() data: AdminApprovePayloadDto) {
    return this.approvalServiceService.approved_update(
      data.id,
      data.status,
      data.user,
    );
  }

  @MessagePattern('admin.getall.approval')
  async getallapproval() {
    return this.approvalServiceService.getallaproval();
  }

  @MessagePattern('admin.reject.request')
  async rejectMessage(@Payload() data: AdminRejectPayloadDto) {
    return this.approvalServiceService.reject_update(
      data.id,
      data.status,
      data.user,
      data.rejectReason,
    );
  }
}
