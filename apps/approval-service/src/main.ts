import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CustomWinstonLogger } from '@app/commons/loggers/my.logger';
import * as dotenv from 'dotenv';
dotenv.config();
import { ApprovalServiceModule } from './approval-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ApprovalServiceModule, {
    bufferLogs: true,
  });

  const logger = app.get(CustomWinstonLogger);
  app.useLogger(logger);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: [`${process.env.NATS_URL || 'nats://127.0.0.1:4222'}`],
        queue: 'approval_service_queue',
      },
    },
    { inheritAppConfig: true },
  );

  const HTTP_PORT = process.env.APPROVAL_PORT || 3003;
  await app.startAllMicroservices();
  await app.listen(HTTP_PORT);

  console.log(
    `Approval Service HTTP is running on: http://localhost:${HTTP_PORT}`,
  );
}
void bootstrap();
