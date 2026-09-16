import { ApprovalStatus } from '@app/commons/enums/approval/approval-status.enum';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  IsIn,
  IsEnum,
} from 'class-validator';

export class payloadleave_reqDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

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
}
