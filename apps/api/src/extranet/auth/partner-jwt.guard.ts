import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class PartnerJwtAuthGuard extends AuthGuard("partner-jwt") {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException("Não autenticado");
    }
    return user;
  }
}

export type PartnerRequestUser = {
  userId: string;
  partnerId: string;
  email: string;
};

export function getPartnerUser(context: ExecutionContext): PartnerRequestUser {
  const request = context.switchToHttp().getRequest<{ user: PartnerRequestUser }>();
  return request.user;
}
