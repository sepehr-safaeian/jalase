import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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
import { ObservabilityModule } from './observability/observability.module.js';
import { REQUEST_ID_HEADER } from './observability/request-id.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'development';
        const pretty =
          config.get<string>('LOG_PRETTY', isDev ? 'true' : 'false') === 'true';
        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL', isDev ? 'debug' : 'info'),
            genReqId: (req, res) => {
              const existing = req.headers[REQUEST_ID_HEADER];
              const id =
                typeof existing === 'string' && existing.trim()
                  ? existing.trim()
                  : randomUUID();
              res.setHeader(REQUEST_ID_HEADER, id);
              return id;
            },
            customProps: (req) => ({
              requestId: req.id,
            }),
            transport: pretty
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                }
              : undefined,
            autoLogging: true,
            quietReqLogger: true,
          },
        };
      },
    }),
    ObservabilityModule,
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
