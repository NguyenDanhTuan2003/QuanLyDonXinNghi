import { Module } from '@nestjs/common';
import { LeaveRequestController } from './leave_request.controller';

@Module({
  controllers: [LeaveRequestController],
  providers: [],
})
export class LeaveRequestModule {}
