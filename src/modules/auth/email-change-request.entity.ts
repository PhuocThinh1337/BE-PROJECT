import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_change_requests')
@Index('IDX_email_change_requests_user', ['userId'])
export class EmailChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ unique: true })
  newEmail: string;

  @Column({ length: 64 })
  otpHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
