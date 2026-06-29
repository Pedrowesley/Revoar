import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard("admin-jwt") {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException("Não autenticado");
    }
    return user;
  }
}

export type AdminRequestUser = {
  adminId: string;
  email: string;
  role: string;
};

export function getAdminUser(context: ExecutionContext): AdminRequestUser {
  const request = context.switchToHttp().getRequest<{ user: AdminRequestUser }>();
  return request.user;
}
