import { ApprovalStatus } from '@app/commons/enums/approval/approval-status.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: String })
  userId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({
    type: String,
    required: true,
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Prop()
  rejectReason: string;

  @Prop()
  processedBy: string;

  @Prop()
  processedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// ==========================================
//  INDEX QUERY CƠ BẢN
// Dùng để query lấy danh sách, phân trang, tìm kiếm, sort thông thường
// ==========================================
LeaveRequestSchema.index({ userId: 1, createdAt: -1 });
LeaveRequestSchema.index({ userId: 1, status: 1, startDate: 1, endDate: 1 });
LeaveRequestSchema.index({ status: 1, createdAt: -1 });
