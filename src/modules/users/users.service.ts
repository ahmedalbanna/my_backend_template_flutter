import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  calculatePagination,
  createPaginationMeta,
  PaginatedResult,
} from '../../shared/prisma/pagination.helper';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Omit<User, 'password' | 'refreshToken'>>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const { skip, take } = calculatePagination({ page, limit });

    const [users, total] = await this.usersRepository.findAll({
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    });

    const sanitized = users.map((u) => this.sanitizeUser(u));

    return {
      data: sanitized,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.update(id, data);
    return this.sanitizeUser(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.usersRepository.remove(id);
    return { message: 'User deleted successfully' };
  }

  async updateFcmToken(id: string, token: string): Promise<void> {
    await this.usersRepository.update(id, { fcmToken: token });
  }

  sanitizeUser(
    user: Omit<User, 'password' | 'refreshToken'> | User,
  ): Omit<User, 'password' | 'refreshToken'> {
    const { password, refreshToken, ...rest } = user as User;
    void [password, refreshToken];
    return rest;
  }
}
