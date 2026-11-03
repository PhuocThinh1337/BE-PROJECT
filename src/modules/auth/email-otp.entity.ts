import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EmailOtpPurpose } from './email-otp-purpose.enum';

@Entity('email_otps')
@Index('UQ_email_otps_email_purpose', ['email', 'purpose'], { unique: true })
export class EmailOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 30 })
  purpose: EmailOtpPurpose;

  @Column({ type: 'uuid', nullable: true })
  requestedByUserId: string | null;

  @Column({ length: 64 })
  otpHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
