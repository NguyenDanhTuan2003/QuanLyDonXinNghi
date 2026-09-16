import { ApprovalStatus } from '@app/commons/enums/approval/approval-status.enum';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
  IsDate,
  IsEnum,
} from 'class-validator';

export class Adminpayloadleave_reqDto {
  @IsOptional()
  @IsString()
  userId: string;
  @IsOptional()
  @IsString()
  email: string;
  @IsOptional()
  @IsString()
  role: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber() // Đổi thành IsNumber vì truyền qua NATS (JSON) sẽ giữ nguyên type
  @Min(1)
  page?: number = 1;
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortby?: string = 'desc';

  //id đơn xin nghỉ
  @IsString()
  @IsOptional()
  requestid?: string;
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
