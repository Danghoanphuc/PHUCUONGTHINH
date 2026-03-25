import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Lead } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private configService: ConfigService) {}

  async sendLeadNotification(lead: Lead): Promise<void> {
    try {
      const ownerEmail = this.configService.get<string>('OWNER_EMAIL');
      if (!ownerEmail) {
        this.logger.warn('OWNER_EMAIL not configured, skipping notification');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      const from = this.configService.get<string>('SMTP_FROM', ownerEmail);

      await transporter.sendMail({
        from,
        to: ownerEmail,
        subject: `New Lead: ${lead.name}`,
        text: [
          `New lead received:`,
          `Name: ${lead.name}`,
          `Phone: ${lead.phone ?? 'N/A'}`,
          `Email: ${lead.email ?? 'N/A'}`,
          `Inquiry Type: ${lead.inquiry_type}`,
          `Created At: ${lead.created_at.toISOString()}`,
        ].join('\n'),
      });

      this.logger.log(`Lead notification sent for lead ${lead.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send lead notification for lead ${lead.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
