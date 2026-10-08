export type PipelineStage = 'asr' | 'review' | 'extract' | 'http';

export type PipelineOutcome =
  | 'ok'
  | 'empty'
  | 'error'
  | 'guardrail_reject';

export interface PipelineStageEvent {
  stage: PipelineStage;
  durationMs: number;
  outcome: PipelineOutcome;
  noteId?: string;
  kind?: string;
  requestId?: string;
  counts?: Record<string, number>;
  errorMessage?: string;
}

export class PipelineTimer {
  private readonly startedAt = Date.now();

  elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  finish(
    stage: PipelineStage,
    outcome: PipelineOutcome,
    extras: Omit<PipelineStageEvent, 'stage' | 'durationMs' | 'outcome'> = {},
  ): PipelineStageEvent {
    return {
      stage,
      durationMs: this.elapsedMs(),
      outcome,
      ...extras,
    };
  }
}
