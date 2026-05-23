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
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiSuccessResponse,
  MessageResponseDto,
} from '../../common/dto/api-response.dto';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from '../../common/dto/paginated-response.dto';

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
  @ApiExtraModels(ApiSuccessResponse, UserResponseDto)
  @ApiResponse({
    status: 200,
    description: 'User profile returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
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
  @ApiExtraModels(ApiSuccessResponse, UserResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
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
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'FCM token updated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(MessageResponseDto) },
          },
        },
      ],
    },
  })
  updateFcmToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateFcmTokenDto,
  ) {
    return this.usersService.updateFcmToken(user.userId, dto.token);
  }

  @Delete('me')
  @Permissions(Permission.USERS_DELETE)
  @ApiOperation({
    summary: 'Delete current authenticated user account',
    description:
      'Permanently deletes the current user account. This action cannot be undone.',
  })
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Account deleted',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(MessageResponseDto) },
          },
        },
      ],
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
  @ApiExtraModels(
    ApiSuccessResponse,
    PaginatedResponseDto,
    PaginationMetaDto,
    UserResponseDto,
  )
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: {
              allOf: [
                { $ref: getSchemaPath(PaginatedResponseDto) },
                {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(UserResponseDto) },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
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
  @ApiExtraModels(ApiSuccessResponse, UserResponseDto)
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
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
  @ApiExtraModels(ApiSuccessResponse, UserResponseDto)
  @ApiResponse({
    status: 200,
    description: 'User updated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
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
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(MessageResponseDto) },
          },
        },
      ],
    },
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
