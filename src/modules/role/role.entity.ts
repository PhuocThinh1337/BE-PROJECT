import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  role: string;

  @Column()
  name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
