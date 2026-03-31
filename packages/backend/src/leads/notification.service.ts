import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Lead } from '@prisma/client';

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

      // Email cho admin
      const adminEmailContent = this.buildAdminEmail(lead);
      await transporter.sendMail({
        from,
        to: ownerEmail,
        subject: `🔔 Yêu cầu mới: ${lead.inquiry_type === 'quote' ? 'Báo giá' : 'Đặt lịch'} - ${lead.name}`,
        html: adminEmailContent,
      });

      this.logger.log(`Admin notification sent for lead ${lead.id}`);

      // Email xác nhận cho khách hàng (nếu có email)
      if (lead.email) {
        const customerEmailContent = this.buildCustomerEmail(lead);
        await transporter.sendMail({
          from,
          to: lead.email,
          subject: `Xác nhận yêu cầu ${lead.inquiry_type === 'quote' ? 'báo giá' : 'đặt lịch'} - Phú Cường Thịnh`,
          html: customerEmailContent,
        });

        this.logger.log(`Customer confirmation sent to ${lead.email}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send lead notification for lead ${lead.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private buildAdminEmail(lead: Lead): string {
    const inquiryTypeLabel =
      lead.inquiry_type === 'quote' ? 'Yêu cầu báo giá' : 'Đặt lịch tư vấn';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0a192f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #0a192f; }
          .value { color: #555; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🔔 ${inquiryTypeLabel} mới</h2>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">Khách hàng:</span>
              <span class="value">${lead.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Số điện thoại:</span>
              <span class="value">${lead.phone || 'Không có'}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${lead.email || 'Không có'}</span>
            </div>
            <div class="info-row">
              <span class="label">Loại yêu cầu:</span>
              <span class="value">${inquiryTypeLabel}</span>
            </div>
            ${
              lead.preferred_date
                ? `
            <div class="info-row">
              <span class="label">Ngày mong muốn:</span>
              <span class="value">${new Date(lead.preferred_date).toLocaleDateString('vi-VN')}</span>
            </div>
            `
                : ''
            }
            ${
              lead.project_details
                ? `
            <div class="info-row">
              <span class="label">Chi tiết:</span>
              <div class="value" style="white-space: pre-wrap; margin-top: 8px;">${lead.project_details}</div>
            </div>
            `
                : ''
            }
            <div class="info-row">
              <span class="label">Thời gian:</span>
              <span class="value">${new Date(lead.created_at).toLocaleString('vi-VN')}</span>
            </div>
            <div class="footer">
              <p>Vui lòng liên hệ khách hàng trong vòng 24h để đảm bảo chất lượng dịch vụ.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildCustomerEmail(lead: Lead): string {
    const inquiryTypeLabel =
      lead.inquiry_type === 'quote' ? 'báo giá' : 'đặt lịch tư vấn';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0a192f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .contact-info { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h2 style="margin: 0;">Xác nhận yêu cầu ${inquiryTypeLabel}</h2>
          </div>
          <div class="content">
            <p>Kính chào <strong>${lead.name}</strong>,</p>
            
            <div class="message">
              <p>Cảm ơn bạn đã quan tâm đến sản phẩm và dịch vụ của <strong>Phú Cường Thịnh</strong>!</p>
              <p>Chúng tôi đã nhận được yêu cầu ${inquiryTypeLabel} của bạn và sẽ liên hệ lại trong vòng <strong>24 giờ</strong> để hỗ trợ bạn tốt nhất.</p>
            </div>

            <div class="contact-info">
              <h3 style="margin-top: 0; color: #0a192f;">📞 Liên hệ ngay</h3>
              <p style="margin: 5px 0;">Hotline: <strong>0901 234 567</strong></p>
              <p style="margin: 5px 0;">Email: <strong>info@phucuongthinh.vn</strong></p>
              <p style="margin: 5px 0;">Địa chỉ: <strong>TP. Hồ Chí Minh</strong></p>
            </div>

            <p style="margin-top: 20px;">Nếu bạn cần hỗ trợ gấp, vui lòng liên hệ trực tiếp qua hotline hoặc Zalo của chúng tôi.</p>

            <div class="footer">
              <p><strong>Phú Cường Thịnh</strong></p>
              <p>Chuyên cung cấp gạch ốp lát, thiết bị vệ sinh cao cấp</p>
              <p style="margin-top: 10px; font-size: 11px;">Email này được gửi tự động, vui lòng không trả lời trực tiếp.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
