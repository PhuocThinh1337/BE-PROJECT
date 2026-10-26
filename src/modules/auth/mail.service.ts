import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  private createTransporter() {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');
    const from = this.config.get<string>('mail.from');
    const port = this.config.get<number>('mail.port');
    if (!host || !user || !password || !from || !port || host.includes('example.com') || user.includes('your-smtp-') || password.includes('your-smtp-') || from.includes('example.com')) {
      throw new ServiceUnavailableException('SMTP email is not configured');
    }
    return { from, transporter: nodemailer.createTransport({ host, port, secure: this.config.get<boolean>('mail.secure'), auth: { user, pass: password } }) };
  }

  async sendPasswordResetOtp(email: string, otp: string, username: string, fullname: string) {
    const { from, transporter } = this.createTransporter();
    const safeName = this.escapeHtml(fullname || username);
    await transporter.sendMail({
      from, to: email,
      subject: 'Ma OTP khoi phuc mat khau - VNA GROUP',
      text: `Xin chao ${fullname}. Ma OTP khoi phuc mat khau cho tai khoan ${username} la ${otp}. Ma co hieu luc trong 5 phut.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px 36px;color:#222;border:1px solid #eee;border-radius:12px"><div style="text-align:center;margin-bottom:28px"><div style="font-size:34px;font-weight:700;color:#c5a334">AV</div><div style="font-weight:700;margin-top:4px">VNA GROUP</div></div><h2 style="font-size:20px">Xin chào, ${safeName}</h2><p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản <strong>${this.escapeHtml(username)}</strong>.</p><p>Mã OTP của bạn:</p><div style="background:#f5f5f7;padding:18px;text-align:center;border-radius:8px;font-size:26px;font-weight:700;letter-spacing:8px">${otp}</div><p>Mã OTP có hiệu lực trong <strong>5 phút</strong>.</p><p style="font-size:13px;color:#666">Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p></div>`,
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const { from, transporter } = this.createTransporter();
    await transporter.sendMail({ from, to: email, subject: 'Password reset request', text: `Use this link to reset your password: ${resetUrl}`, html: `<p><a href="${resetUrl}">Reset password</a></p>` });
  }

  async sendEmailChangeOtp(email: string, otp: string) {
    const { from, transporter } = this.createTransporter();
    await transporter.sendMail({
      from, to: email, subject: 'Ma OTP xac minh thay doi email - VNA GROUP',
      text: `Ma OTP xac minh thay doi email cua ban la ${otp}. Ma co hieu luc trong 5 phut.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px 36px;color:#222;border:1px solid #eee;border-radius:12px"><div style="text-align:center;margin-bottom:28px"><div style="font-size:34px;font-weight:700;color:#c5a334">AV</div><div style="font-weight:700;margin-top:4px">VNA GROUP</div></div><h2 style="font-size:20px">Xin chào,</h2><p>Bạn đã yêu cầu xác minh địa chỉ email mới cho tài khoản VNA GROUP.</p><p>Mã OTP của bạn:</p><div style="background:#f5f5f7;padding:18px;text-align:center;border-radius:8px;font-size:26px;font-weight:700;letter-spacing:8px">${otp}</div><p>Mã OTP có hiệu lực trong <strong>5 phút</strong>.</p><p style="font-size:13px;color:#666">Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu thay đổi email, vui lòng bỏ qua email này.</p></div>`,
    });
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] as string));
  }
}
