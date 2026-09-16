import { Module, ValidationPipe } from '@nestjs/common';
import { ApprovalServiceController } from './approval-service.controller';
import { ApprovalServiceService } from './approval-service.service';
import { AppConfigModule } from '@app/commons/config/config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/commons/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Approval, ApprovalRequestSchema } from './schemas/approval.schema';
import { BullModule } from '@nestjs/bullmq';
import { ApprovalServiceConsumer } from './approval-service.consumer';
import { ApprovalExpirationProcessor } from './approval-expiration.processor';
import { CustomNatsModule } from '@app/commons/custom_natsclient_traceid/CustomNatsClient.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from '@app/commons/filters/all-exceptions.filter';
import { TransformInterceptor } from '@app/commons/interceptors/transform.interceptor';
import { RedisModule } from '@app/commons/database/redis.module';
import { LoggerModule } from '@app/commons/loggers/logger.module';

@Module({
  imports: [
    LoggerModule.forRoot('APPROVAL-SERVICE'),
    CustomNatsModule,
    AppConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTls = configService.get<string>('REDIS_TLS') === 'true';

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST'),
            port: Number(configService.get<number>('REDIS_PORT')) || 6379,
            username: 'default',
            password: configService.get<string>('REDIS_PASSWORD'),
            ...(isTls && { tls: {} }),
          },
        };
      },
    }),
    RedisModule,
    BullModule.registerQueue({
      name: 'approval-expiration-queue',
    }),

    DatabaseModule,
    MongooseModule.forFeature([
      { name: Approval.name, schema: ApprovalRequestSchema },
    ]),
  ],
  controllers: [ApprovalServiceController, ApprovalServiceConsumer],
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
    ApprovalServiceService,
    ApprovalExpirationProcessor,
  ],
})
export class ApprovalServiceModule {}
