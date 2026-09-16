import { ApprovalStatus } from '../../enums/approval/approval-status.enum';
import { Equals, IsNotEmpty, IsString, Matches } from 'class-validator';

export class Admin_reject_dto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @Equals(ApprovalStatus.REJECTED, { message: 'Trạng thái phải là REJECTED' })
  status: ApprovalStatus.REJECTED;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @Matches(/\S/, { message: 'Lý do không được chỉ chứa khoảng trắng' })
  rejectReason: string;
}
