import { Module } from "@nestjs/common";
import { PartnerAuthModule } from "../auth/partner-auth.module";
import { PartnerProfileController } from "./partner-profile.controller";
import { PartnerProfileService } from "./partner-profile.service";

@Module({
  imports: [PartnerAuthModule],
  controllers: [PartnerProfileController],
  providers: [PartnerProfileService],
})
export class PartnerProfileModule {}
