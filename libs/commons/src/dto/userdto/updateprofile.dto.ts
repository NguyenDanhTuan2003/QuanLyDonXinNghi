import {
  IsString,
  IsOptional,
  IsDate,
  MaxDate,
  Matches,
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
  @IsOptional()
  @Matches(/^(\+84|0[35789])[0-9]{8}$/, {
    message:
      'Số điện thoại không đúng định dạng (VD: 0912345678 hoặc +84323456789)',
  })
  phoneNumber?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày sinh không hợp lệ' })
  @MaxDate(new Date(), { message: 'Ngày sinh phải là ngày trong quá khứ' })
  dateOfBirth?: Date;
}
