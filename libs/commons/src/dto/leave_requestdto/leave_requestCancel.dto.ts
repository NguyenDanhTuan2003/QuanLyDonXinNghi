import { ApprovalStatus } from '../../enums/approval/approval-status.enum';
import { Equals } from 'class-validator';

export class LeaveRequestCancelDto {
  @Equals(ApprovalStatus.CANCELLED, {
    message: 'Trạng thái bắt buộc phải là CANCELLED để thực hiện thao tác này',
  })
  status: ApprovalStatus.CANCELLED;
}
