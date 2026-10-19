import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(email: string, resetUrl: string) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');
    const from = this.config.get<string>('mail.from');
    const port = this.config.get<number>('mail.port');

    if (
      !host || !user || !password || !from || !port ||
      host.includes('example.com') || user.includes('your-smtp-') ||
      password.includes('your-smtp-') || from.includes('example.com')
    ) {
      throw new ServiceUnavailableException('SMTP email is not configured');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get<boolean>('mail.secure'),
      auth: { user, pass: password },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Password reset request',
      text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
      html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>`,
    });
  }
}
