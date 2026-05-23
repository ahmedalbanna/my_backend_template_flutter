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

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findAll(query: PaginationQueryDto): Promise<{
    data: Omit<User, 'password' | 'refreshToken'>[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAll({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const sanitized = users.map((u) => this.sanitizeUser(u));

    return {
      data: sanitized,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

  private sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken'> {
    const { password, refreshToken, ...rest } = user;
    void [password, refreshToken];
    return rest;
  }
}
