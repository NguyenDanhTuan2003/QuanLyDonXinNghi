import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu cũ phải từ 6 ký tự trở lên' })
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' })
  newPassword: string;
}
