import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findByResetToken(token);
  }

  async findAll(query: PaginationQueryDto): Promise<{ data: Omit<User, 'password' | 'refreshToken'>[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAll({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const sanitized = users.map(({ password, refreshToken, ...u }) => u);

    return {
      data: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.update(id, data);
    const { password, refreshToken, ...result } = user;
    return result;
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    return this.usersRepository.updateRefreshToken(id, refreshToken);
  }

  async updatePassword(id: string, password: string): Promise<void> {
    return this.usersRepository.updatePassword(id, password);
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    return this.usersRepository.setPasswordResetToken(id, token, expires);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.usersRepository.remove(id);
    return { message: 'User deleted successfully' };
  }
}
