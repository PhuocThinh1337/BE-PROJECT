import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AccidentCategoryType {
  INJURY_FACTOR = 'INJURY_FACTOR',
  INJURY_TYPE = 'INJURY_TYPE',
  OCCUPATION = 'OCCUPATION',
}

@Entity('accident_categories')
@Index('UQ_accident_categories_type_code', ['type', 'code'], { unique: true })
export class AccidentCategory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 30 }) type: AccidentCategoryType;
  @Column({ length: 50 }) code: string;
  @Column({ length: 200 }) name: string;
  @Column({ default: true }) isActive: boolean;
}
