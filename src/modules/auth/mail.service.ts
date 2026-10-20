import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PASSWORD_RESET_OTP_TTL_MINUTES } from './auth.constants';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetOtp(email: string, otp: string, username: string, fullName?: string) {
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
      throw new ServiceUnavailableException('Chưa cấu hình dịch vụ gửi email SMTP.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get<boolean>('mail.secure'),
      auth: { user, pass: password },
    });

    const displayName = fullName?.trim() || username;
    const safeName = this.escapeHtml(displayName);
    const safeUsername = this.escapeHtml(username);
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Mã OTP khôi phục mật khẩu - VNA Group',
      text: `Xin chào ${displayName} (${username}), mã OTP khôi phục mật khẩu của bạn là ${otp}. Mã có hiệu lực trong ${PASSWORD_RESET_OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
      html: `<div style="max-width:600px;margin:0 auto;padding:32px;font-family:Arial,sans-serif;color:#222;border:1px solid #e5e7eb;border-radius:8px"><div style="text-align:center;margin-bottom:28px"><div style="font-size:38px;font-weight:700;letter-spacing:3px;color:#c9a227">AV</div><div style="font-size:14px;font-weight:700">VNA GROUP</div></div><h2>Xin chào, ${safeName}</h2><p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản <strong>${safeUsername}</strong>.</p><p>Mã OTP của bạn:</p><div style="padding:16px;text-align:center;background:#f3f4f6;border-radius:6px;font-size:30px;font-weight:700;letter-spacing:8px">${otp}</div><p>Mã OTP có hiệu lực trong <strong>${PASSWORD_RESET_OTP_TTL_MINUTES} phút</strong>.</p><p>Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p></div>`,
    });
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
  }

  async sendEmailChangeOtp(email: string, otp: string) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');
    const from = this.config.get<string>('mail.from');
    const port = this.config.get<number>('mail.port');
    if (!host || !user || !password || !from || !port || host.includes('example.com') ||
      user.includes('your-smtp-') || password.includes('your-smtp-') || from.includes('example.com')) {
      throw new ServiceUnavailableException('Chưa cấu hình dịch vụ gửi email SMTP.');
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
      subject: 'Mã OTP xác minh thay đổi email',
      text: `Mã OTP xác minh thay đổi email của bạn là ${otp}. Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
      html: `<p>Mã OTP xác minh thay đổi email của bạn là <strong>${otp}</strong>.</p><p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`,
    });
  }
}
