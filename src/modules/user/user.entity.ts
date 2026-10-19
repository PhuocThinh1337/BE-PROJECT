import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import * as argon2 from 'argon2';
import { Role } from '../role/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  @Index({ unique: true })
  email: string;

  @Column({ default: false })
  status: boolean;

  @Column({ nullable: true, select: false })
  resetPasswordTokenHash: string;

  @Column({ nullable: true, select: false })
  resetPasswordExpiresAt: Date;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }
}
