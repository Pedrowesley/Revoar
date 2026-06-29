import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getPartnerUser, PartnerRequestUser } from "./partner-jwt.guard";

export const CurrentPartner = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PartnerRequestUser => {
    return getPartnerUser(context);
  },
);
