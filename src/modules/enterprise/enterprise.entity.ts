import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { BusinessIndustry, BusinessType } from './enterprise-reference.entity';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true, length: 10 })
  taxCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'date', nullable: true })
  licenseIssueDate: string | null;

  @Column({ type: 'uuid' })
  businessTypeId: string;

  @ManyToOne(() => BusinessType, { nullable: false })
  @JoinColumn({ name: 'businessTypeId' })
  businessType: BusinessType;

  @Column({ type: 'uuid' })
  businessIndustryId: string;

  @ManyToOne(() => BusinessIndustry, { nullable: false })
  @JoinColumn({ name: 'businessIndustryId' })
  businessIndustry: BusinessIndustry;

  @Column({ length: 150 })
  province: string;

  @Column({ length: 150 })
  ward: string;

  @Column({ nullable: true, length: 500 })
  address: string | null;

  @Column({ nullable: true, length: 200 })
  foreignName: string | null;

  @Column({ length: 254 })
  email: string;

  @Column({ nullable: true, length: 30 })
  officePhone: string | null;

  @Column({ nullable: true, length: 150 })
  operatingProvince: string | null;

  @Column({ nullable: true, length: 150 })
  operatingWard: string | null;

  @Column({ nullable: true, length: 500 })
  businessLocation: string | null;

  @Column({ nullable: true, length: 150 })
  representative: string | null;

  @Column({ nullable: true, length: 30 })
  representativePhone: string | null;

  @Column({ nullable: true })
  businessLicenseUrl: string | null;

  @Column({ nullable: true })
  otherDocumentUrl: string | null;
}
