import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../enums/guard/role.enum';
import { RequestWithUser } from '../../interfaces/context.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user) {
      return false;
    }
    if (!requiredRoles.some((role) => user?.role === role)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập chức năng này (Yêu cầu quyền ADMIN)',
      );
    }
    return true;
  }
}
