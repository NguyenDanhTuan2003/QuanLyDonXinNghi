import { Module, ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppConfigModule } from '@app/commons/config/config.module';
import { RedisModule } from '@app/commons/database/redis.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from '@app/commons/filters/all-exceptions.filter';
import { TransformInterceptor } from '@app/commons/interceptors/transform.interceptor';
import { LoggerModule } from '@app/commons/loggers/logger.module';

@Module({
  imports: [
    LoggerModule.forRoot('USER_SERVICE'),
    AppConfigModule,
    RedisModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      //AllExceptionsFilter cần CustomWinstonLogger được truyền vào constructor, nên NestJS phải tự đứng ra khởi tạo instance cho nó
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
  ],
})
export class UserServiceModule {}
