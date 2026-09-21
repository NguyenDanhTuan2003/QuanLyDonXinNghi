import { ApprovalStatus } from '@app/commons/enums/approval/approval-status.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseFilterDto } from '../common/base-filter.dto';

export class Adminpayloadleave_reqDto extends BaseFilterDto {
  // id đơn xin nghỉ
  @IsString()
  @IsOptional()
  requestid?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  startDate?: Date | Record<string, string>;

  @IsOptional()
  endDate?: Date | Record<string, string>;
}
