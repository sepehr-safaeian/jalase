import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service.js';

describe('MetricsService', () => {
  it('aggregates stage latency samples', () => {
    const metrics = new MetricsService();
    metrics.record({
      stage: 'extract',
      durationMs: 100,
      outcome: 'ok',
      kind: 'summary',
    });
    metrics.record({
      stage: 'extract',
      durationMs: 300,
      outcome: 'ok',
      kind: 'summary',
    });

    const snap = metrics.snapshot();
    const row = snap.stages.find((s) => s.key === 'extract:summary');
    expect(row?.count).toBe(2);
    expect(row?.avgMs).toBe(200);
    expect(row?.p50Ms).toBe(100);
    expect(row?.p95Ms).toBe(300);
  });
});
