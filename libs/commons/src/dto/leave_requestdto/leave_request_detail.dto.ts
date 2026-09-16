import { IsNotEmpty, IsString } from 'class-validator';

export class leaveDetailDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  requestid: string;
}
