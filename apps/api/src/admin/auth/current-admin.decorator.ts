import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getAdminUser } from "./admin-jwt.guard";

export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  getAdminUser(context),
);
