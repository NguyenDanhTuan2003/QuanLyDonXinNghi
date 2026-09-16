import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { IUser } from '@app/commons/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { updateProfileDto } from '@app/commons/dto/userdto/updateprofile.dto';
import { updatePasswordDto } from '@app/commons/dto/userdto/updatepassword.dto';
import { createRpcError } from '@app/commons/helpers/throw_nat_custom';
import { ALL_CUSTOM_RPC_ERRORS } from '@app/commons/enums/rpc/rpc_error.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly usermodel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async checkprofile(user: IUser) {
    const data = await this.usermodel.findById(user._id).lean().exec();

    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.USER_NOT_FOUND);
    }

    const {
      _id,
      email,
      fullname,
      role,
      status,
      phoneNumber,
      dateOfBirth,
      department,
      position,
    } = data;
    return {
      _id,
      email,
      fullname,
      role,
      status,
      phoneNumber,
      dateOfBirth,
      department,
      position,
    };
  }

  private async checkPassword(
    password: string,
    checkPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, checkPassword);
  }

  private async encodePassword(password: string): Promise<string> {
    const readenv = Number(this.configService.get<number>('bcrypt.saltRound'));
    return await bcrypt.hash(password, readenv);
  }

  async Updateprofile(user: IUser, dto: updateProfileDto) {
    const { _id } = user;
    const data = await this.usermodel
      .findByIdAndUpdate(_id, { $set: dto }, { lean: true, new: true })
      .exec();

    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.USER_NOT_FOUND);
    }
    return {
      success: true,
      message: 'Cập nhật thông tin thành công',
    };
  }

  async changePassword(user: IUser, body: updatePasswordDto) {
    const { _id, email } = user;
    const data = await this.usermodel.findOne({ _id, email });

    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.USER_ACCOUNT_DELETED);
    }

    const { oldPassword, newPassword } = body;
    const isMatch = await this.checkPassword(oldPassword, data.password);
    if (!isMatch) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.USER_WRONG_OLD_PASSWORD);
    }

    const hashPassword = await this.encodePassword(newPassword);
    data.password = hashPassword;
    await data.save();

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  }

  async findUsersByIds(ids: string[]) {
    const data = await this.usermodel
      .find({ _id: { $in: ids } })
      .select('_id fullname email department position')
      .lean()
      .exec();
    if (!data) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.USER_NOT_FOUND);
    }
    return data;
  }
}
