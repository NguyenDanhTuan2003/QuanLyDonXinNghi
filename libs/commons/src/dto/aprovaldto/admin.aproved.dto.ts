import { ApprovalStatus } from '../../enums/approval/approval-status.enum';
import { Equals, IsNotEmpty } from 'class-validator';
export class Admin_approved_dto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @Equals(ApprovalStatus.APPROVED, { message: 'Trạng thái phải là APPROVED' })
  status: ApprovalStatus.APPROVED;
}
