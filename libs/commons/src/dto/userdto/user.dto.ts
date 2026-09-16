import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { IUser } from '../../interfaces/user.interface';

export class userDto implements IUser {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  fullname?: string;
}
