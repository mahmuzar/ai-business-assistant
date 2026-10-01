import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './health-check.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  @Get('liveness')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  }

  @Get('readiness')
  async readiness() {
    const checks = await Promise.allSettled([
      this.healthCheck.checkDatabase(),
      this.healthCheck.checkDocumentSource(),
    ]);

    const isReady = checks.every(r => r.status === 'fulfilled');
    if (!isReady) {
      return { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        checks: checks.map(c => c.status === 'rejected' ? c.reason.message : 'ok') 
      };
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  async health() {
    const [dbResult, sourceResult] = await Promise.allSettled([
      this.healthCheck.checkDatabase(),
      this.healthCheck.checkDocumentSource(),
    ]);

    return {
      status: dbResult.status === 'fulfilled' && sourceResult.status === 'fulfilled' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        database: dbResult.status === 'fulfilled' ? 'ok' : dbResult.reason.message,
        document_source: sourceResult.status === 'fulfilled' ? 'ok' : sourceResult.reason.message,
      },
    };
  }
}