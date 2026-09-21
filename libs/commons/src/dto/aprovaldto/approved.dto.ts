import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class approved_dto {
  @IsString()
  @IsOptional()
  _id?: string;
  @IsString()
  @IsOptional()
  email?: string;
  @IsString()
  @IsOptional()
  newData: { status: string };
  @IsString()
  messageName: string;
  @IsString()
  @IsOptional()
  expiresAt?: string;
  @IsNotEmpty({ message: 'Thông báo không được để trống' })
  @IsString()
  message: string;
}
