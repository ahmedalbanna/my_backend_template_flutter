import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  AuthTokensWithUserDto,
  AuthTokensDto,
  AuthUserResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiSuccessResponse } from '../../common/dto/api-response.dto';
import { MessageResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user account and returns JWT access + refresh tokens. ' +
      'The email must be unique. Password must be at least 6 characters.',
  })
  @ApiExtraModels(
    ApiSuccessResponse,
    AuthTokensWithUserDto,
    AuthUserResponseDto,
  )
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthTokensWithUserDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or email already in use',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: 'Email already in use',
        },
      },
    },
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and receive JWT tokens',
    description:
      'Validates email and password, returns JWT access + refresh tokens. ' +
      'Use the access token in the Authorize header for protected endpoints.',
  })
  @ApiExtraModels(
    ApiSuccessResponse,
    AuthTokensWithUserDto,
    AuthUserResponseDto,
  )
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthTokensWithUserDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password, or account deactivated',
    schema: {
      example: {
        success: false,
        error: { statusCode: 401, message: 'Invalid credentials' },
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
    description:
      'Exchange a valid refresh token for a new access/refresh token pair. ' +
      'Refresh tokens expire after 7 days and can only be used once.',
  })
  @ApiExtraModels(ApiSuccessResponse, AuthTokensDto)
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthTokensDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 401,
          message: 'Invalid or expired refresh token',
        },
      },
    },
  })
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.AUTH_LOGOUT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout and invalidate the refresh token',
    description:
      'Invalidates the stored refresh token for the current user. ' +
      'The access token will continue to work until it expires naturally.',
  })
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
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
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    schema: {
      example: {
        success: false,
        error: { statusCode: 401, message: 'Authentication required' },
      },
    },
  })
  logout(@CurrentUser() user: { userId: string }) {
    return this.authService.logout(user.userId);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset token',
    description:
      'Sends a password reset token to the user email if it exists. ' +
      'Always returns the same response to prevent email enumeration.',
  })
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (or user not found — same response)',
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
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: ['email must be an email'],
        },
      },
    },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using a reset token',
    description:
      'Resets the user password using the token received via forgot-password flow. ' +
      'Also invalidates all existing refresh tokens for the user.',
  })
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
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
  @ApiResponse({
    status: 404,
    description: 'Invalid or expired reset token',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 404,
          message: 'Invalid or expired reset token',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (token required, min length)',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: ['newPassword must be longer than or equal to 6 characters'],
        },
      },
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send OTP to phone for registration or login',
    description:
      'Generates a 6-digit OTP and stores it hashed in the database. ' +
      'If the phone does not exist, a new inactive user is created. ' +
      'In simulation mode, the OTP is returned directly in the response.',
  })
  @ApiExtraModels(ApiSuccessResponse, MessageResponseDto)
  @ApiResponse({
    status: 200,
    description: 'OTP sent (simulated)',
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
  @ApiResponse({
    status: 400,
    description: 'Invalid phone format',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: [
            'Phone must be in international format (e.g. +201234567890)',
          ],
        },
      },
    },
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and receive JWT tokens',
    description:
      'Validates the 6-digit OTP for the given phone number. ' +
      'On success: activates the user (if first-time registration) and ' +
      'returns JWT access + refresh tokens.',
  })
  @ApiExtraModels(
    ApiSuccessResponse,
    AuthTokensWithUserDto,
    AuthUserResponseDto,
  )
  @ApiResponse({
    status: 200,
    description: 'OTP verified — login/registration successful',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthTokensWithUserDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or OTP expired',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: 'OTP has expired',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Phone not found',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 404,
          message: 'No account found with this phone number',
        },
      },
    },
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
