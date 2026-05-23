import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Permissions(Permission.USERS_READ)
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description:
      'Returns the profile of the currently authenticated user. Password and refresh token are excluded.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile returned',
    schema: {
      example: {
        success: true,
        data: {
          id: 'cmpx0abc123def456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isActive: true,
          fcmToken: null,
          createdAt: '2026-05-23T12:00:00.000Z',
          updatedAt: '2026-05-23T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getProfile(@CurrentUser() user: { userId: string }) {
    const found = await this.usersService.findById(user.userId);
    if (!found) throw new NotFoundException('User not found');
    return this.usersService.sanitizeUser(found);
  }

  @Put('me')
  @Permissions(Permission.USERS_WRITE)
  @ApiOperation({
    summary: 'Update current authenticated user profile',
    description:
      'Updates the profile of the currently authenticated user. ' +
      'Role and isActive fields are ignored — users cannot promote themselves.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: {
      example: {
        success: true,
        data: {
          id: 'cmpx0abc123def456',
          email: 'newemail@example.com',
          firstName: 'John',
          lastName: 'Smith',
          role: 'USER',
          isActive: true,
          createdAt: '2026-05-23T12:00:00.000Z',
          updatedAt: '2026-05-23T12:01:00.000Z',
        },
      },
    },
  })
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUserDto,
  ) {
    const { role, isActive, ...safeDto } = dto;
    void [role, isActive];
    return this.usersService.update(user.userId, safeDto);
  }

  @Patch('fcm-token')
  @Permissions(Permission.USERS_WRITE)
  @ApiOperation({
    summary: 'Update FCM push notification token',
    description:
      'Stores a Firebase Cloud Messaging token for the current user. ' +
      'Used to send push notifications to mobile devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'FCM token updated',
    schema: {
      example: { success: true, data: { message: 'FCM token updated' } },
    },
  })
  updateFcmToken(
    @CurrentUser() user: { userId: string },
    @Body('token') token: string,
  ) {
    return this.usersService.updateFcmToken(user.userId, token);
  }

  @Delete('me')
  @Permissions(Permission.USERS_DELETE)
  @ApiOperation({
    summary: 'Delete current authenticated user account',
    description:
      'Permanently deletes the current user account. This action cannot be undone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted',
    schema: {
      example: {
        success: true,
        data: { message: 'User deleted successfully' },
      },
    },
  })
  removeMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.remove(user.userId);
  }

  @Get()
  @Roles('ADMIN')
  @Permissions(Permission.USERS_READ)
  @ApiOperation({
    summary: '[Admin] List all users with pagination',
    description:
      'Returns a paginated list of all users. Only accessible by ADMIN role. ' +
      'Password and refreshToken fields are excluded from the response.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 'cmpx0abc123def456',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'User',
              role: 'ADMIN',
              isActive: true,
              createdAt: '2026-05-23T12:00:00.000Z',
              updatedAt: '2026-05-23T12:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USERS_READ)
  @ApiOperation({
    summary: '[Admin] Get a user by ID',
    description:
      'Returns a specific user by their unique ID. Only accessible by ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      example: {
        success: true,
        data: {
          id: 'cmpx0abc123def456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isActive: true,
          createdAt: '2026-05-23T12:00:00.000Z',
          updatedAt: '2026-05-23T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.sanitizeUser(user);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USERS_MANAGE)
  @ApiOperation({
    summary: '[Admin] Update any user (including role & isActive)',
    description:
      'Updates any user in the system. Unlike the self-update endpoint, ' +
      'this allows changing the role and isActive fields. Only ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    schema: {
      example: {
        success: true,
        data: {
          id: 'cmpx0abc123def456',
          email: 'updated@example.com',
          role: 'ADMIN',
          isActive: true,
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USERS_DELETE)
  @ApiOperation({
    summary: '[Admin] Delete a user permanently',
    description:
      'Permanently deletes a user from the system. Only ADMIN. This action cannot be undone.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    schema: {
      example: {
        success: true,
        data: { message: 'User deleted successfully' },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
