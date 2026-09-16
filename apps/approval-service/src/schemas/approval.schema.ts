import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApprovalRequestDocument = Approval & Document;

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Approval {
  @Prop({ required: true })
  requestName: string;

  @Prop({
    type: String,
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Prop({ required: true, index: true }) // user gủi yêu cầu
  id_req: string;

  @Prop({ type: Object })
  oldData: Record<string, any>; // Dữ liệu cũ

  @Prop({ type: Object })
  newData: Record<string, any>; // Dữ liệu mới

  @Prop({ type: Date })
  expiresAt?: Date; // Thời gian hết hạn

  @Prop({ type: Date })
  processAt?: Date; // Thời gian duyệt

  @Prop()
  processedBy: string;

  @Prop()
  rejectReason: string; // Lý do từ chối

  @Prop({ type: Date })
  rejectAt?: Date; // Thời gian từ chối

  @Prop()
  createdByemailName: string;

  @Prop({ required: true }) // Tên message bắn đi
  messageName: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ApprovalRequestSchema = SchemaFactory.createForClass(Approval);
ApprovalRequestSchema.index({ status: 1, createdAt: -1 });
