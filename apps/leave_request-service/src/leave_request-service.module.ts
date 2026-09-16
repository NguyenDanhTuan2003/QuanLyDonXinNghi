import { Module, ValidationPipe } from '@nestjs/common';
import { LeaveRequestServiceService } from './leave_request-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomNatsModule } from '@app/commons/custom_natsclient_traceid/CustomNatsClient.module';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../schemas/leave_request.schema';
import { LoggerModule } from '@app/commons/loggers/logger.module';
import {
  AllExceptionsFilter,
  DatabaseModule,
  TransformInterceptor,
} from '@app/commons';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LeaveRequestServiceConsumer } from './leave_request-service.consumer';
import { LeaveRequestServiceController } from './leave_request-service.controller';

@Module({
  imports: [
    LoggerModule.forRoot('LEAVE_REQUEST_SERVICE'),
    CustomNatsModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
    ]),
  ],
  controllers: [LeaveRequestServiceConsumer, LeaveRequestServiceController],
  providers: [
    LeaveRequestServiceService,
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
export class LeaveRequestServiceModule {}
