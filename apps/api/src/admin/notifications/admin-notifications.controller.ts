import { Controller, Get, MessageEvent, Sse, UseGuards } from "@nestjs/common";
import { Observable } from "rxjs";
import { RevoarEvent } from "@revoar/shared";
import { EventBusService } from "../../events/event-bus.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { AdminJwtAuthGuard } from "../auth/admin-jwt.guard";

@Controller("admin/notifications")
@UseGuards(AdminJwtAuthGuard)
export class AdminNotificationsController {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get("outbox")
  outbox() {
    return this.notifications.recentMessages();
  }

  @Sse("stream")
  stream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const listener = (event: RevoarEvent) => {
        subscriber.next({ data: event });
      };

      const unsubscribe = this.eventBus.onAdminEvent(listener);
      return () => unsubscribe();
    });
  }
}
