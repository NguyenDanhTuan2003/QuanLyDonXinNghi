import { Body, Controller, Post, Get, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '@app/commons/guards/acccesstoken_guard/accesstoken.guard';
import { CurrentUser } from '@app/commons/decorators/data-jwt.decorator';
import { updateProfileDto } from '@app/commons/dto/userdto/updateprofile.dto';
import { updatePasswordDto } from '@app/commons/dto/userdto/updatepassword.dto';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';

@Controller('api/users')
export class UsersController {
  constructor(private readonly natsClient: CustomNatsClient) {}
  @UseGuards(AccessTokenGuard)
  @Get('profile')
  checkprofile(@CurrentUser() user: userInterface.IUser) {
    return this.natsClient.send('users.profile', user);
  }

  @UseGuards(AccessTokenGuard)
  @Put('profile')
  updateprofile_approval(
    @Body() body: updateProfileDto,
    @CurrentUser() user: userInterface.IUser,
  ) {
    return this.natsClient.send('users.updateprofile', {
      body,
      user,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Post('change-password')
  updatepassword(
    @Body() body: updatePasswordDto,
    @CurrentUser() user: userInterface.IUser,
  ) {
    return this.natsClient.send('users.change-password', { body, user });
  }
}
