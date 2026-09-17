import {
  IsString,
  IsOptional,
  IsPhoneNumber,
  IsDate,
  MaxDate,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Date)
  @IsDate({ message: 'Ngày sinh không hợp lệ' })
  @MaxDate(new Date(), { message: 'Ngày sinh phải là ngày trong quá khứ' })
  dateOfBirth?: Date;
}
