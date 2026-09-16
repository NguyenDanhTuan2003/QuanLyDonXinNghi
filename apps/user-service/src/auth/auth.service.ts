import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { registerDto } from '@app/commons/dto/authdto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUser, RfPayload } from '@app/commons/interfaces/user.interface';
import { loginDto } from '@app/commons/dto/authdto/login.dto';
import { RpcException } from '@nestjs/microservices';
import { REDIS_CLIENT } from '@app/commons/database/redis.module';
import Redis from 'ioredis';
import { createRpcError } from '@app/commons/helpers/throw_nat_custom';
import { ALL_CUSTOM_RPC_ERRORS } from '@app/commons/enums/rpc/rpc_error.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ==================================== Danh sách các hàm nội bộ ====================================
  private async encodePassword(password: string): Promise<string> {
    const readenv = Number(
      this.configService.get<number>('bcrypt.saltRound') ?? 10,
    );
    return await bcrypt.hash(password, readenv);
  }
  private async checkPassword(
    password: string,
    checkPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, checkPassword);
  }

  private async createAccessToken(
    payload: Record<string, unknown>,
  ): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<number>('jwt.expiresInaccess'),
    });
  }

  private async createRefreshToken(
    payload: Record<string, unknown>,
  ): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<number>('jwt.expiresInrefresh'),
    });
  }
  // ==================================== Danh sách các hàm logic ====================================
  async change_accestoken(rftoken: string) {
    try {
      const verify = await this.jwtService.verifyAsync<RfPayload>(rftoken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const data = await this.userModel.findById(verify._id);
      if (!data || data.status !== 'ACTIVE') {
        throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_ACCOUNT_LOCKED);
      }

      const { _id, fullname, email, role, status } = data;
      const accessToken = await this.createAccessToken({
        _id: _id.toString(),
        fullname,
        email,
        role,
        status,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_TOKEN_INVALID);
    }
  }

  async register(
    register: registerDto,
  ): Promise<{ success: boolean; message: string; data: IUser }> {
    const { email } = register;
    const lower_email = email.toLowerCase();
    const checkemail = await this.userModel.findOne({ email: lower_email });

    if (checkemail) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_EMAIL_EXISTS);
    }

    const hashpassword = await this.encodePassword(register.password);
    const user = await this.userModel.create({
      ...register,
      password: hashpassword,
      status: 'ACTIVE',
      role: 'USER',
      email: lower_email,
    });

    const userPlain = user.toObject();
    const { _id, fullname, role } = userPlain;

    const finalData: IUser = {
      _id: _id.toString(),
      email: lower_email,
      fullname,
      role,
    } as IUser;

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: finalData,
    };
  }

  async login(body: loginDto) {
    const user = await this.userModel.findOne({ email: body.email });
    if (!user) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_WRONG_CREDENTIALS);
    }

    const check = await this.checkPassword(body.password, user.password);
    if (!check) {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_WRONG_CREDENTIALS);
    }

    const userIdStr = user._id.toString();

    const redisKey = `auth:session:${userIdStr}:${user.email}`;
    const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60; // 7 ngày

    const data_token = {
      _id: userIdStr,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.createAccessToken(data_token);
    const refreshToken = await this.createRefreshToken(data_token);

    await this.redis.set(
      redisKey,
      refreshToken,
      'EX',
      REFRESH_TOKEN_EXPIRATION,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(rawtoken: string, user: IUser, refreshToken: string) {
    try {
      const actoken = await this.jwtService.verifyAsync<{
        _id: string;
        exp: number;
        iat: number;
        [key: string]: unknown;
      }>(rawtoken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const ttlInSeconds = actoken.exp - nowInSeconds;

      if (ttlInSeconds > 0) {
        const redisKey = `auth:blacklist:${rawtoken}`;
        await this.redis.set(redisKey, '1', 'EX', ttlInSeconds);
      }

      const rftoken = await this.jwtService.verifyAsync<{
        _id: string;
        exp: number;
        iat: number;
        [key: string]: unknown;
      }>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      const ttl_rftoken = rftoken.exp - nowInSeconds;

      if (ttl_rftoken > 0) {
        const black_list = `auth:blacklist:${refreshToken}`;
        await this.redis.set(black_list, '1', 'EX', ttl_rftoken);
      }

      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    } catch {
      throw createRpcError(ALL_CUSTOM_RPC_ERRORS.AUTH_TOKEN_INVALID);
    }
  }
}
