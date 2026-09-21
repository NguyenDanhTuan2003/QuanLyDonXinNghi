// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { Inject } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { firstValueFrom, timeout } from 'rxjs';
// import { CustomWinstonLogger } from '@app/commons';

// interface ApprovalUpdatePayload {
//   _id: string | number;
//   messageName: string;
//   expiresAt?: Date | string | number;
//   message: string;
//   newData: {
//     email: string;
//     fullname: string;
//   };
// }

// interface ServiceResponse {
//   user_message: string;
//   success: boolean;
// }

// @Processor('approval-expiration-queue')
// export class ApprovalExpirationProcessor extends WorkerHost {
//   private readonly logger = new CustomWinstonLogger();

//   constructor(
//     @Inject('NATS_SERVICE')
//     private readonly client: ClientProxy,
//   ) {
//     super();
//   }

//   async process(job: Job<ApprovalUpdatePayload>): Promise<void> {
//     if (job.name !== 'process-expiration') return;

//     const update_data: ApprovalUpdatePayload = job.data;
//     const jobId = String(update_data._id);
//     const context = ApprovalExpirationProcessor.name;

//     this.logger.log(`[Redis Queue] Đơn ${jobId} đã đến giờ thực thi`, context);

//     // 1. Kiểm tra thời gian thực thi (Tolerance Check)
//     const now = Date.now();
//     if (update_data.expiresAt) {
//       const expiresAtTimestamp = new Date(update_data.expiresAt).getTime();
//       const TOLERANCE_MS = 5000;

//       update_data.message =
//         now > expiresAtTimestamp + TOLERANCE_MS
//           ? 'Đơn được chạy nhưng muộn do lỗi server hoặc bên thứ 3'
//           : 'Đơn đã được chạy đúng hạn';
//     } else {
//       update_data.message =
//         'Lỗi đơn không có expiresAt nhưng vẫn được duyệt vào job';
//     }

//     // 2. Gửi lệnh SEND qua NATS kèm Timeout 5s
//     try {
//       const response = await firstValueFrom<ServiceResponse>(
//         this.client
//           .send<ServiceResponse>(update_data.messageName, update_data)
//           .pipe(timeout(5000)),
//       );

//       this.logger.log(
//         `[Redis Queue] Đã gửi SEND thành công cho pattern "${update_data.messageName}" (Đơn ID: ${jobId}). Phản hồi: ${response?.user_message ?? 'OK'}`,
//         context,
//       );
//     } catch (error: unknown) {
//       let errMessage = 'Lỗi không xác định';
//       if (error instanceof Error) {
//         errMessage = error.message;
//       } else if (typeof error === 'object' && error !== null) {
//         const errObj = error as Record<string, unknown>;
//         const msg = errObj.message ?? errObj.error;
//         errMessage =
//           typeof msg === 'string'
//             ? msg
//             : Array.isArray(msg)
//               ? msg.join('; ')
//               : JSON.stringify(errObj);
//       } else {
//         errMessage = String(error);
//       }
//       this.logger.error(
//         `[Redis Queue] Gửi tin nhắn thất bại hoặc Timeout (Đơn ID: ${jobId}): ${errMessage}`,
//         error instanceof Error ? error.stack : undefined,
//         context,
//       );
//       throw error;
//     }
//   }
// }
