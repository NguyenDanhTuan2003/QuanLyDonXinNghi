import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'USER' })
  role: string;

  @Prop({ default: 'ACTIVE' })
  status: string;
  @Prop()
  phoneNumber: string;
  @Prop()
  dateOfBirth: string;
  @Prop()
  department: string;
  @Prop()
  position: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
