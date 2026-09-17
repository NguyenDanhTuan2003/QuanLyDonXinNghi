import { DynamicModule, Global, Module } from '@nestjs/common';
import { CustomWinstonLogger } from './my.logger';
@Global()
@Module({})
//giả sử tôi k code cái dinamic module kia thì lúc khai báo sẽ cực hơn hả sẽ phải cấu hình provide ở bên module bên kia  hoặc phải tự new
export class LoggerModule {
  // tự xây dựng dynamic module để các service khác k viết lại
  static forRoot(servicename: string): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: CustomWinstonLogger,
          useFactory: () => new CustomWinstonLogger(servicename),
        },
      ],
      exports: [CustomWinstonLogger],
    };
  }
}
