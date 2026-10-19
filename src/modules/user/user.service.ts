import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username }, relations: ['role'] });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.userRepository.findOne({ where: { id }, relations: ['role'] });
  }

  findByIdForPassword(id: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByEmailForReset(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.resetPasswordTokenHash')
      .addSelect('user.resetPasswordExpiresAt')
      .where('user.email = :email', { email })
      .getOne();
  }

  save(user: User) {
    return this.userRepository.save(user);
  }
}
