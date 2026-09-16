import { Controller, Get, Param, Patch, UseGuards, Body } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CustomNatsClient } from '@app/commons/custom_natsclient_traceid/custom-nats.client';
import { AccessTokenGuard } from '@app/commons/guards/acccesstoken_guard/accesstoken.guard';
import * as userInterface from '@app/commons/interfaces/user.interface';
import { CurrentUser } from '@app/commons/decorators/data-jwt.decorator';
import { Admin_reject_dto } from '@app/commons/dto/aprovaldto/admin.reject.dto';
import { Admin_approved_dto } from '@app/commons/dto/aprovaldto/admin.aproved.dto';
import { RoleGuard } from '@app/commons';
import { Roles } from '@app/commons/decorators/roles.decorator';
import { Role } from '@app/commons/enums/guard/role.enum';

@Controller('api/approval')
export class ApprovalController {
  constructor(private readonly natsClient: CustomNatsClient) {}

  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approved') // 2. Mở đường dẫn HTTP
  async approved(
    @Param('id') id: string,
    @Body() dto: Admin_approved_dto,
    @CurrentUser() user: userInterface.IUser, // 3. Lấy thông tin user từ Token
  ) {
    // 4. Gửi NATS và ép kiểu sang Promise bằng firstValueFrom
    const check = await firstValueFrom(
      this.natsClient.send<Record<string, unknown>>('admin.approve.request', {
        id,
        status: dto.status,
        user,
      }),
    );

    // 5. Trả kết quả về cho Client (Postman)
    return check;
  }
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN) // 1. Chặn lại kiểm tra Token ở cổng bảo vệ
  @Patch(':id/reject') // 2. Mở đường dẫn HTTP
  async reject(
    @Param('id') id: string,
    @Body() dto: Admin_reject_dto,
    @CurrentUser() user: userInterface.IUser,
  ) {
    // 4. Gửi NATS và ép kiểu sang Promise bằng firstValueFrom
    const check = await firstValueFrom(
      this.natsClient.send<Record<string, unknown>>('admin.reject.request', {
        id,
        status: dto.status,
        rejectReason: dto.rejectReason,
        user,
      }),
    );

    // 5. Trả kết quả về cho Client (Postman)
    return check;
  }
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get('getallapproval')
  async getallapproval(@CurrentUser() user: userInterface.IUser) {
    return await firstValueFrom(
      this.natsClient.send<Record<string, unknown>>(
        'admin.getall.approval',
        user,
      ),
    );
  }
}
