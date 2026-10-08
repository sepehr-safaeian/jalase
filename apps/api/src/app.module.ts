import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { NotesModule } from './notes/notes.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
// Payments / Zibal gateway - disabled for the open-source build.
// Set PAYMENTS_ENABLED=true and uncomment to restore billing:
// import { PaymentsModule } from './payments/payments.module.js';
import { TranscriptionModule } from './transcription/transcription.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    HealthModule,
    FeatureFlagsModule,
    AuthModule,
    ProjectsModule,
    NotesModule,
    // Keeps free-tier subscription rows; no payment UI/gateway
    SubscriptionsModule,
    // PaymentsModule,
    TranscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
