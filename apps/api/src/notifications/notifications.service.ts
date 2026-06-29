import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

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

  private async send(payload: EmailPayload) {
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
