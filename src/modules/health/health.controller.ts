import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check system health status',
    description:
      'Performs a lightweight database connectivity check. ' +
      'Returns 200 if the database is reachable, 503 if it is down. ' +
      'Use this endpoint for monitoring and orchestration health probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'All systems operational',
    schema: {
      example: {
        success: true,
        data: {
          status: 'ok',
          database: 'up',
          timestamp: '2026-05-23T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database is down',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 503,
          message: {
            status: 'error',
            database: 'down',
            timestamp: '2026-05-23T12:00:00.000Z',
          },
        },
      },
    },
  })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
