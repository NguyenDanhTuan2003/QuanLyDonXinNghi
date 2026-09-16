import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { ApiGatewayModule } from './api-gateway.module';
import { CustomWinstonLogger } from '@app/commons/loggers/my.logger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    bufferLogs: true,
  });
  app.useLogger(new CustomWinstonLogger('GATEWAY'));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ], // Cho phép cả Frontend Vite gọi API
    // origin: true, // Hoặc cho phép tất cả các domain
    credentials: true, // Bắt buộc phải bật nếu bạn dùng cookie-parser (gửi cookie/session từ client)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  // NATS Listener để nhận các Event (ví dụ: users.profile.approved) bắn Socket về Client
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [`${process.env.NATS_URL || 'nats://127.0.0.1:4222'}`],
      queue: 'api_gateway_queue',
    },
  });
  app.use(cookieParser());

  await app.startAllMicroservices();

  const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3000;
  await app.listen(PORT);
  console.log(`API Gateway is running on: http://localhost:${PORT}`);
}

void bootstrap();
