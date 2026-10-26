import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('business_types')
export class BusinessType {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 50 }) code: string;
  @Column({ unique: true, length: 100 }) name: string;
  @Column({ default: true }) isActive: boolean;
}

@Entity('business_industries')
export class BusinessIndustry {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 50 }) code: string;
  @Column({ unique: true, length: 150 }) name: string;
  @Column({ type: 'int', default: 4 }) level: number;
}
