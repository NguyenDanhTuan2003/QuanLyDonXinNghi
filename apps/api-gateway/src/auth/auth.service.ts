import { Injectable, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { loginDto } from '@app/commons/dto/authdto/login.dto';
import express from 'express';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private readonly natsClient: CustomNatsClient,
  ) {}

  // vì nest sẽ nạp env trước khi mà constructor chạy nên phải get ở đây để lúc cần móc ra tránh trường hợp chưa nạp xong ô lại dùng
  get isProduction() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
  async login(
    body: loginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const tokens: userInterface.AuthTokensResponse = await firstValueFrom(
      this.natsClient.send('auth.login', body),
    );

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      // Khi deploy (HTTPS), secure BẮT BUỘC = true, sameSite BẮT BUỘC = 'none'
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return {
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        accesstoken: tokens.accessToken,
      },
    };
  }
  async changeAccessToken(req: express.Request, response: express.Response) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refreshToken ?? '';

    const tokens: userInterface.AuthTokensResponse = await firstValueFrom(
      this.natsClient.send('auth.refresh_token', { refreshToken }),
    );

    if (tokens?.refreshToken) {
      response.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: this.isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 * 1000,
      });
    }

    return {
      success: true,
      message: 'Cấp lại Access Token thành công!',
      data: {
        accesstoken: tokens.accessToken,
      },
    };
  }
  logout(req: express.Request, authHeader: string, user: userInterface.IUser) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refreshToken ?? '';
    const token = authHeader?.split(' ')[1];
    const payload = {
      _id: user._id,
      email: user.email,
      fullname: user.fullname,
      status: user.status,
      role: user.role,
    };
    return this.natsClient.send('auth.logout', {
      token,
      payload,
      refreshToken,
    });
  }
}
