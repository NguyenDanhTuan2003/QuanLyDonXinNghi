import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
export class updateProfileDto {
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi' })
  fullname?: string;
  // @IsOptional()
  // @IsFutureDate({
  //   message: 'Thời gian hết hạn phải sau thời gian hiện tại',
  // })
  // @Transform(({ value }: TransformFnParams) => {
  //   if (!value) return undefined;
  //   return new Date(value as string | Date | number);
  // })
  // expiresAt?: Date;
  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ',
  })
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    return new Date(value as string | Date | number);
  })
  dateOfBirth?: Date;
}
