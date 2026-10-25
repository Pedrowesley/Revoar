import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export type OutboxMessage = EmailPayload;

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

  private async send(payload: EmailPayload) {
    this.outbox.push(payload);
    const apiKey = this.config.get<string>("RESEND_API_KEY");

    if (!apiKey) {
      this.logger.log(`[email stub] To: ${payload.to} | ${payload.subject}`);
      return;
    }

    const from = this.config.get<string>("EMAIL_FROM") ?? "Revoar <noreply@revoar.com.br>";

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
  }
}
