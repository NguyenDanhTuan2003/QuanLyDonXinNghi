import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';
import { CreateLeaveRequestDto } from '@app/commons/dto/leave_requestdto/register_leave_request.dto';
import { AccessTokenGuard } from '@app/commons/guards/acccesstoken_guard/accesstoken.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '@app/commons/decorators/data-jwt.decorator';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { RoleGuard } from '@app/commons';
import { Roles } from '@app/commons/decorators/roles.decorator';
import { Role } from '@app/commons/enums/guard/role.enum';
import { LeaveRequestCancelDto } from '@app/commons/dto/leave_requestdto/leave_requestCancel.dto';
@Controller('api/leave-request')
export class LeaveRequestController {
  constructor(private readonly natsClient: CustomNatsClient) {}
  @UseGuards(AccessTokenGuard)
  @Post('create')
  createLeaveRequest(
    @Body() body: CreateLeaveRequestDto,
    @CurrentUser() user: userInterface.IUser,
  ) {
    return this.natsClient.send('leave_request.create', { body, user });
  }

  @UseGuards(AccessTokenGuard)
  @Get('getall')
  getLeaveRequestByUser(
    @CurrentUser() user: userInterface.IUser,
    @Query('page') page: number,
    @Query('sortby') sortby: string,
    @Query('status') status: string,
  ) {
    return this.natsClient.send('leave_request.getall', {
      userId: user._id,
      role: user.role,
      status: status,
      page,
      sortby,
    });
  }

  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get('admin/getall')
  getLeaveRequestByAdmin(
    @Query('page') page: number,
    @Query('sortby') sortby: string,
    @Query('status') status: string,
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.natsClient.send('admin_leave_request.getall', {
      userId,
      page,
      sortby,
      status,
      startDate,
      endDate,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  getDetailLeaveRequest(
    @CurrentUser() user: userInterface.IUser,
    @Param('id') id: string,
  ) {
    return this.natsClient.send('leave_request.detail', {
      _id: user._id,
      role: user.role,
      requestid: id,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/cancel')
  cancelLeaveRequest(
    @Param('id') id_cancel: string,
    @Body() body: LeaveRequestCancelDto,
    @CurrentUser() user: userInterface.IUser,
  ) {
    return this.natsClient.send('leave_request.cancel', {
      id_cancel,
      status: body.status,
      user,
    });
  }
}
