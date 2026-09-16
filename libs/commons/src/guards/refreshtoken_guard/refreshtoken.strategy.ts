import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import Redis from 'ioredis';
import { IUser } from '../../interfaces/user.interface';
import { REDIS_CLIENT } from '../../database/redis.module';

// Helper trích xuất token ưu tiên Cookie, nếu không có mới tìm ở Header
const cookieOrHeaderExtractor = (req: Request): string | null => {
  let token: string | null = null;
  const cookies = req.cookies as Record<string, string>;

  if (req && cookies && cookies.refreshToken) {
    token = cookies.refreshToken;
  }
  if (!token) {
    token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  }

  return token;
};

@Injectable()
export class RefreshtokenStrategy extends PassportStrategy(
  Strategy,
  'rftokenjwt',
) {
  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || 'tuan2003',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IUser) {
    if (!payload?._id) {
      throw new UnauthorizedException('Dữ liệu token không hợp lệ');
    }

    const userId = payload._id;
    const refreshToken = cookieOrHeaderExtractor(req);
    const redisKey = `auth:session:${userId}:${payload.email}`;
    const redisKeySession = await this.redis.get(redisKey);
    const blacklist_rftoken = `auth:blacklist:${refreshToken}`;

    if (!redisKeySession) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      );
    }
    if (await this.redis.get(blacklist_rftoken)) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      );
    }

    // Trích xuất lại token gửi lên để so sánh với Redis
    const tokenFromRequest = cookieOrHeaderExtractor(req);

    if (redisKeySession !== tokenFromRequest) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      _id: payload._id,
      email: payload.email,
      fullname: payload.fullname,
      status: payload.status,
      role: payload.role,
    };
  }
}
