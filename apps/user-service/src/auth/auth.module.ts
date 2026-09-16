import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '@app/commons/database/redis.module';
import { LoggerModule } from '@app/commons/loggers/logger.module';

@Module({
  imports: [
    LoggerModule.forRoot('AUTH_SERVICE'),
    RedisModule,
    //vì ông config để ở global nên giờ k cần khai báo chỉ cần import ở module tổng của service thì cũng dùng đc rồi
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<number>('jwt.expiresInaccess'),
        },
      }),
    }),

    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  // import pasportmodule tức là import 2 chiến lước startegy
})
export class AuthModule {}
