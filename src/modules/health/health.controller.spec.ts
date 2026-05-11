import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<Partial<HealthCheckService>>;

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn() } },
        { provide: PrismaService, useValue: { $queryRaw: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call health check', async () => {
    healthCheckService.check!.mockResolvedValue({ status: 'ok' } as any);
    const result = await controller.check();
    expect(healthCheckService.check).toHaveBeenCalled();
    expect(result).toEqual({ status: 'ok' });
  });
});
