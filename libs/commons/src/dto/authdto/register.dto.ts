import { IsCustomPassword } from '@app/commons/validators/is-custom-password.validator';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
export class registerDto {
  @IsString({ message: 'Tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên không được để trống ' })
  fullname: string;

  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsCustomPassword()
  password: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phoneNumber: string;

  @IsString({ message: 'Ngày sinh phải là chuỗi' })
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  dateOfBirth: string;

  @IsString({ message: 'Khoa phải là chuỗi' })
  @IsNotEmpty({ message: 'Khoa không được để trống' })
  department: string;

  @IsString({ message: 'Chức vụ phải là chuỗi' })
  @IsNotEmpty({ message: 'Chức vụ không được để trống' })
  position: string;
}
