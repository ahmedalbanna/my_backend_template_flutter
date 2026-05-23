import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check system health status (database connection)' })
  @ApiResponse({ status: 200, description: 'All systems operational' })
  @ApiResponse({ status: 503, description: 'Database is down' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
