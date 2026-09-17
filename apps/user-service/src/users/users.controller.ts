import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { updateProfileDto } from '@app/commons/dto/userdto/updateprofile.dto';
import { updatePasswordDto } from '@app/commons/dto/userdto/updatepassword.dto';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.profile')
  checkProfile(@Payload() user: userInterface.IUser) {
    return this.usersService.checkprofile(user);
  }

  @MessagePattern('users.updateprofile')
  updateProfile(
    @Payload()
    data: {
      body: updateProfileDto;
      user: userInterface.IUser;
    },
  ) {
    return this.usersService.Updateprofile(data.user, data.body);
  }

  @MessagePattern('users.change-password')
  changePassword(
    @Payload() data: { body: updatePasswordDto; user: userInterface.IUser },
  ) {
    return this.usersService.changePassword(data.user, data.body);
  }

  @MessagePattern('users.get_batch')
  async getUsersBatch(@Payload() data: { userIds: string[] }) {
    return await this.usersService.findUsersByIds(data.userIds);
  }
}
