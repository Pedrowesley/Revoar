import { Controller, MessageEvent, Sse, UseGuards } from "@nestjs/common";
import { Observable } from "rxjs";
import { RevoarEvent } from "@revoar/shared";
import { EventBusService } from "../../events/event-bus.service";
import { CurrentPartner } from "../auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../auth/partner-jwt.guard";

@Controller("extranet/notifications")
@UseGuards(PartnerJwtAuthGuard)
export class PartnerNotificationsController {
  constructor(private readonly eventBus: EventBusService) {}

  @Sse("stream")
  stream(@CurrentPartner() partner: PartnerRequestUser): Observable<MessageEvent> {
    const partnerId = partner.partnerId;

    return new Observable((subscriber) => {
      const listener = (event: RevoarEvent) => {
        subscriber.next({ data: event });
      };

      const unsubscribe = this.eventBus.onPartnerEvent(partnerId, listener);
      return () => unsubscribe();
    });
  }
}
