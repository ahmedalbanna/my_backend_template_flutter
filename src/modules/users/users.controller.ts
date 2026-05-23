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
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getProfile(@CurrentUser() user: { userId: string }) {
    const found = await this.usersService.findById(user.userId);
    if (!found) throw new NotFoundException('User not found');
    const { password, refreshToken, ...result } = found;
    return result;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUserDto,
  ) {
    const { role, isActive, ...safeDto } = dto;
    return this.usersService.update(user.userId, safeDto);
  }

  @Patch('fcm-token')
  @ApiOperation({ summary: 'Update FCM token for current user' })
  updateFcmToken(
    @CurrentUser() user: { userId: string },
    @Body('token') token: string,
  ) {
    return this.usersService.updateFcmToken(user.userId, token);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current authenticated user account' })
  removeMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.remove(user.userId);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] List all users with pagination' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { password, refreshToken, ...result } = user;
    return result;
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Update any user (including role & isActive)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Delete a user permanently' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
