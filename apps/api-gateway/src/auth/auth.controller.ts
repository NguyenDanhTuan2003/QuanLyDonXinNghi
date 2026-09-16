import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import express from 'express';

import * as userInterface from '@app/commons/interfaces/user.interface';
import { loginDto } from '@app/commons/dto/authdto/login.dto';
import { registerDto } from '@app/commons/dto/authdto/register.dto';
import { RefreshTokenGuard } from '@app/commons/guards/refreshtoken_guard/refreshtoken.guard';
import { AccessTokenGuard } from '@app/commons/guards/acccesstoken_guard/accesstoken.guard';
import { CurrentUser } from '@app/commons';
import { AuthService } from './auth.service';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly natsClient: CustomNatsClient,
  ) {}

  @Post('login')
  async login(
    @Body() body: loginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.login(body, response);
  }

  @Post('register')
  register(@Body() body: registerDto) {
    return this.natsClient.send('auth.register', body);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async changeAccessToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.changeAccessToken(req, response);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(
    @Req() req: express.Request,
    @Headers('authorization') authHeader: string,
    @CurrentUser() user: userInterface.IUser,
  ) {
    return this.authService.logout(req, authHeader, user);
  }
}
