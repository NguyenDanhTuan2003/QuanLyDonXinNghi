import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class approval_request_saveDB_dto {
  @IsString()
  @IsOptional()
  action: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | Date;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  id_leave_req?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsObject()
  @IsOptional()
  oldData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  newData?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  messageName: string;
}
