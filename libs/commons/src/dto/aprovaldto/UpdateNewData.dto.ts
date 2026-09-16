import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class UpdateNewDataDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  id_req: string;

  @IsString()
  @IsNotEmpty()
  processedBy: string;

  @Type(() => Date)
  @IsDate({ message: 'Ngày xử lý phải là ngày hợp lệ' })
  @IsNotEmpty({ message: 'Ngày xử lý không được để trống' })
  processAt: Date;

  @IsNotEmpty()
  newData: Record<string, any> | string;

  @IsString()
  @IsNotEmpty()
  messageName: string;

  @IsOptional()
  expiresAt?: Date;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  createdByemailName: string;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}
