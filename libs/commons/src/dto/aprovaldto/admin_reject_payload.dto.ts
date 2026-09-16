import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { userDto } from '../userdto/user.dto';
import { ApprovalStatus } from '../../enums/approval/approval-status.enum';

export class AdminRejectPayloadDto {
  @IsNotEmpty({ message: 'ID không được để trống' })
  @IsString({ message: 'ID phải là chuỗi' })
  id: string;

  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ApprovalStatus, { message: 'Trạng thái không hợp lệ' })
  status: ApprovalStatus;

  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  @IsString({ message: 'Lý do từ chối phải là chuỗi' })
  rejectReason: string;

  @IsDefined({ message: 'Thông tin người dùng không được để trống' })
  @IsObject()
  @ValidateNested()
  @Type(() => userDto)
  user: userDto;
}
