import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { HealthResponseDto } from './dto/health-response.dto.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'بررسی سلامت سرویس' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  check(): HealthResponseDto {
    return this.healthService.check();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'In-memory pipeline latency aggregates (dev / METRICS_ENABLED)',
  })
  @ApiResponse({ status: 200, description: 'Latency snapshot by stage' })
  @ApiResponse({ status: 404, description: 'Metrics disabled' })
  metrics() {
    return this.healthService.getMetrics();
  }
}
