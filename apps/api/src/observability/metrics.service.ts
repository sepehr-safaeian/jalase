import { Injectable } from '@nestjs/common';
import type { PipelineStage, PipelineStageEvent } from './pipeline-timer.js';

interface StageStats {
  count: number;
  sumMs: number;
  samples: number[];
}

const MAX_SAMPLES = 256;

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx]!;
}

@Injectable()
export class MetricsService {
  private readonly stages = new Map<string, StageStats>();

  record(event: PipelineStageEvent): void {
    const key = event.kind ? `${event.stage}:${event.kind}` : event.stage;
    let stats = this.stages.get(key);
    if (!stats) {
      stats = { count: 0, sumMs: 0, samples: [] };
      this.stages.set(key, stats);
    }
    stats.count += 1;
    stats.sumMs += event.durationMs;
    stats.samples.push(event.durationMs);
    if (stats.samples.length > MAX_SAMPLES) {
      stats.samples.shift();
    }
  }

  snapshot(): {
    generatedAt: string;
    stages: Array<{
      key: string;
      stage: PipelineStage | string;
      count: number;
      avgMs: number;
      p50Ms: number;
      p95Ms: number;
    }>;
  } {
    const stages = [...this.stages.entries()].map(([key, stats]) => {
      const sorted = [...stats.samples].sort((a, b) => a - b);
      return {
        key,
        stage: key.split(':')[0]!,
        count: stats.count,
        avgMs: stats.count ? stats.sumMs / stats.count : 0,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
      };
    });
    return {
      generatedAt: new Date().toISOString(),
      stages,
    };
  }
}
