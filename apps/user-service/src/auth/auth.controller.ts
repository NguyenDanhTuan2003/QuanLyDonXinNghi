import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { registerDto } from '@app/commons/dto/authdto/register.dto';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { loginDto } from '@app/commons';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(
    @Payload() register: registerDto,
  ): Promise<{ success: boolean; message: string; data: userInterface.IUser }> {
    return await this.authService.register(register);
  }

  @MessagePattern('auth.login')
  async login(@Payload() body: loginDto) {
    return await this.authService.login(body);
  }

  @MessagePattern('auth.refresh_token')
  async changeAccessToken(@Payload() data: { refreshToken: string }) {
    return await this.authService.change_accestoken(data.refreshToken);
  }
  @MessagePattern('auth.logout')
  async logout(
    @Payload()
    data: {
      token: string;
      payload: userInterface.IUser;
      refreshToken: string;
    },
  ) {
    return await this.authService.logout(
      data.token,
      data.payload,
      data.refreshToken,
    );
  }
}
