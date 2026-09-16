import { IsDefined, IsObject, ValidateNested } from 'class-validator';
import { CreateLeaveRequestDto } from './register_leave_request.dto';
import { Type } from 'class-transformer';
import { userDto } from '../userdto/user.dto';

export class CreateLeaveRequestPayloadDto {
  @ValidateNested()
  @Type(() => CreateLeaveRequestDto)
  body: CreateLeaveRequestDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => userDto)
  user: userDto;
}
