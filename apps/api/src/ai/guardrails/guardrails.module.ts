import { Module } from '@nestjs/common';
import { GuardrailsService } from './guardrails.service.js';

@Module({
  providers: [GuardrailsService],
  exports: [GuardrailsService],
})
export class GuardrailsModule {}
