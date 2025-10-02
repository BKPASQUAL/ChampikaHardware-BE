import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../../database/enums/user-role.enum';

// Decorator to mark routes as public (no auth required)
export const Public = () => SetMetadata('isPublic', true);

// Decorator to specify required roles
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Decorator to get current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);