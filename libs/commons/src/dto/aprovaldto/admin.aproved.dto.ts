import { IsFutureDate } from '@app/commons/decorators/is-future-date.decorator';
import { ApprovalStatus } from '../../enums/approval/approval-status.enum';
import { Equals, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
export class Admin_approved_dto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @Equals(ApprovalStatus.APPROVED, { message: 'Trạng thái phải là APPROVED' })
  status: ApprovalStatus.APPROVED;
  @IsFutureDate({ message: 'Ngày hết hạn phải là ngày trong tương lai' })
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
}
