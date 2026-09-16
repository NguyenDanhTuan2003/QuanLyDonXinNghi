import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import Redis from 'ioredis';
import { IUser } from '../../interfaces/user.interface';
import { REDIS_CLIENT } from '../../database/redis.module';

@Injectable()
export class AccesstokenStrategy extends PassportStrategy(
  Strategy,
  'actokenjwt',
) {
  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || 'tuan2003',
      passReqToCallback: true, // BẮT BUỘC: Cho phép truyền Request vào hàm validate
    });
  }

  async validate(req: Request, payload: IUser & { exp: number }) {
    if (!payload._id) {
      throw new UnauthorizedException('Dữ liệu token không hợp lệ');
    }

    const checkblacklist = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    //cú pháp fromfromAuthHeaderAsBearerToken() là lấy cái công cụ check token từ header ra sau đó gán req vào để nó lấy token ra
    const exists = await this.redis.exists(`auth:blacklist:${checkblacklist}`);
    if (exists) {
      throw new UnauthorizedException('Phiên đăng nhập hết hạn login lại đi');
    }

    return {
      _id: payload._id,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      fullname: payload.fullname,
    };
  }
}
