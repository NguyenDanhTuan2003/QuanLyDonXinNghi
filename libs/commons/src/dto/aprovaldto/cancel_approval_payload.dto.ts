import {
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { userDto } from '../userdto/user.dto';

export class CancelApprovalPayloadDto {
  @IsNotEmpty({ message: 'ID yêu cầu (id_req) không được để trống' })
  @IsString({ message: 'ID yêu cầu (id_req) phải là chuỗi' })
  id_req: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsDefined({ message: 'Thông tin người dùng không được để trống' })
  @IsObject()
  @ValidateNested()
  @Type(() => userDto)
  user: userDto;
}
