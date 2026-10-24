import { Injectable } from "@nestjs/common";
import { EventEmitter } from "events";
import { RevoarEvent } from "@revoar/shared";

export const ADMIN_EVENTS_CHANNEL = "revoar:admin";
export const partnerEventsChannel = (partnerId: string) => `revoar:partner:${partnerId}`;

@Injectable()
export class EventBusService {
  private readonly emitter = new EventEmitter();

  emitToAdmins(event: RevoarEvent) {
    this.emitter.emit(ADMIN_EVENTS_CHANNEL, event);
  }

  emitToPartner(partnerId: string, event: RevoarEvent) {
    this.emitter.emit(partnerEventsChannel(partnerId), event);
  }

  onAdminEvent(listener: (event: RevoarEvent) => void) {
    this.emitter.on(ADMIN_EVENTS_CHANNEL, listener);
    return () => this.emitter.off(ADMIN_EVENTS_CHANNEL, listener);
  }

  onPartnerEvent(partnerId: string, listener: (event: RevoarEvent) => void) {
    const channel = partnerEventsChannel(partnerId);
    this.emitter.on(channel, listener);
    return () => this.emitter.off(channel, listener);
  }
}
