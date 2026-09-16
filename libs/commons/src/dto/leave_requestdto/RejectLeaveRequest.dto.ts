import {
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { userDto } from '../userdto/user.dto';
import { ApprovalStatus } from '../../enums/approval/approval-status.enum';

export class RejectLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  id_cancel: string;

  @IsNotEmpty()
  status: ApprovalStatus.CANCELLED;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => userDto)
  user: userDto;
}
