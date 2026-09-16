import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { UserServiceModule } from './user-service.module';
import { CustomWinstonLogger } from '@app/commons/loggers/my.logger';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule, {
    bufferLogs: true,
  });
  app.useLogger(new CustomWinstonLogger('USER'));
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: [`${process.env.NATS_URL || 'nats://127.0.0.1:4222'}`],
        queue: 'user_service_queue',
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();

  const HTTP_PORT = process.env.USER_SERVICE_PORT || 3002;
  await app.listen(HTTP_PORT);

  console.log(`User Service HTTP is running on: http://localhost:${HTTP_PORT}`);
}
void bootstrap();
