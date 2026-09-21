import { Module, ValidationPipe } from '@nestjs/common';
import { ApprovalServiceController } from './approval-service.controller';
import { ApprovalServiceService } from './approval-service.service';
import { AppConfigModule } from '@app/commons/config/config.module';
import { DatabaseModule } from '@app/commons/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Approval, ApprovalRequestSchema } from './schemas/approval.schema';
import { ApprovalServiceConsumer } from './approval-service.consumer';
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
    RedisModule,
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
  ],
})
export class ApprovalServiceModule {}
