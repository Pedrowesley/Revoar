import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export type OutboxMessage = EmailPayload;

export type StayNotice = {
  to: string;
  code: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalLabel: string;
  link: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly outbox: OutboxMessage[] = [];

  constructor(private readonly config: ConfigService) {}

  recentMessages() {
    return this.outbox.slice(-20);
  }

  async sendPartnerSignupPending(email: string, legalName: string) {
    await this.send({
      to: email,
      subject: "Cadastro recebido — Revoar",
      html: `<p>Olá, ${legalName}!</p><p>Recebemos seu cadastro. Nossa equipe analisará e você receberá um e-mail quando sua conta for aprovada.</p>`,
    });
  }

  async sendPartnerApproved(email: string, legalName: string) {
    await this.send({
      to: email,
      subject: "Conta aprovada — Revoar",
      html: `<p>Olá, ${legalName}!</p><p>Sua conta de parceiro foi aprovada. Acesse a extranet para cadastrar hotéis e enviar para revisão.</p>`,
    });
  }

  async sendHotelApproved(email: string, hotelName: string) {
    await this.send({
      to: email,
      subject: `Hotel aprovado: ${hotelName}`,
      html: `<p>Seu hotel <strong>${hotelName}</strong> foi aprovado e está ativo na Revoar.</p>`,
    });
  }

  async sendHotelRejected(email: string, hotelName: string, reason: string) {
    await this.send({
      to: email,
      subject: `Hotel precisa de ajustes: ${hotelName}`,
      html: `<p>Seu hotel <strong>${hotelName}</strong> foi revisado e precisa de ajustes.</p><p><strong>Motivo:</strong> ${reason}</p>`,
    });
  }

  async sendPasswordReset(email: string, link: string) {
    await this.send({
      to: email,
      subject: "Redefinir senha — Revoar",
      html: `<p>Para escolher uma senha nova, abra este link:</p><p><a href="${link}">${link}</a></p><p>O link vale por 30 minutos e só pode ser usado uma vez.</p>`,
    });
  }

  async sendPartnerSuspended(email: string, legalName: string) {
    await this.send({
      to: email,
      subject: "Conta suspensa — Revoar",
      html: `<p>Olá, ${legalName}!</p><p>Sua conta de parceiro foi suspensa. Entre em contato com a equipe Revoar.</p>`,
    });
  }

  async sendBookingRequested(stay: StayNotice) {
    await this.send({
      to: stay.to,
      subject: `Pedido enviado — ${stay.hotelName}`,
      html: this.stayHtml(stay, "<p>Pedido enviado. O hotel tem até 24 horas para responder. Nada é cobrado agora.</p>"),
    });
  }

  async sendBookingAccepted(stay: StayNotice) {
    await this.send({
      to: stay.to,
      subject: `O hotel aceitou — ${stay.hotelName}`,
      html: this.stayHtml(stay, "<p>O hotel aceitou. Pague em até 2 horas para confirmar a reserva.</p>"),
    });
  }

  async sendBookingDeclined(stay: StayNotice) {
    await this.send({
      to: stay.to,
      subject: `O hotel recusou — ${stay.hotelName}`,
      html: this.stayHtml(stay, "<p>O hotel recusou o pedido. Nada foi cobrado.</p>"),
    });
  }

  async sendBookingVoucher(stay: StayNotice) {
    await this.send({
      to: stay.to,
      subject: `Voucher ${stay.code} — ${stay.hotelName}`,
      html: this.stayHtml(stay, `<p>Reserva confirmada. Este é o voucher <strong>${escapeHtml(stay.code)}</strong>.</p>`),
    });
  }

  private stayHtml(stay: StayNotice, intro: string) {
    return [
      intro,
      `<p><strong>${escapeHtml(stay.hotelName)}</strong><br>${escapeHtml(stay.roomName)}<br>${escapeHtml(stay.checkIn)} a ${escapeHtml(stay.checkOut)}<br>${escapeHtml(stay.totalLabel)}</p>`,
      `<p>Código <strong>${escapeHtml(stay.code)}</strong></p>`,
      `<p><a href="${escapeHtml(stay.link)}">Abrir a viagem</a></p>`,
    ].join("");
  }

  private async send(payload: EmailPayload) {
    this.outbox.push(payload);
    const apiKey = this.config.get<string>("RESEND_API_KEY");

    if (!apiKey) {
      this.logger.log(`[email stub] To: ${payload.to} | ${payload.subject}`);
      return;
    }

    const from = this.config.get<string>("EMAIL_FROM") ?? "Revoar <noreply@revoar.com.br>";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Falha ao enviar e-mail: ${error}`);
      }
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail: ${error instanceof Error ? error.message : "erro de rede"}`);
    }
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char] ?? char;
  });
}
