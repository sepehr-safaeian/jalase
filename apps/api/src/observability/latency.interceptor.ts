import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service.js';
import { PipelineTimer } from './pipeline-timer.js';

@Injectable()
export class LatencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LatencyInterceptor');

  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const timer = new PipelineTimer();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, timer, 'ok'),
        error: () => this.record(req, res, timer, 'error'),
      }),
    );
  }

  private record(
    req: Request,
    res: Response,
    timer: PipelineTimer,
    outcome: 'ok' | 'error',
  ): void {
    const event = timer.finish('http', outcome, {
      requestId: req.requestId,
      counts: { statusCode: res.statusCode || 0 },
    });
    this.metrics.record(event);
    this.logger.log(
      JSON.stringify({
        msg: 'http.request',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        durationMs: event.durationMs,
        outcome,
      }),
    );
  }
}
