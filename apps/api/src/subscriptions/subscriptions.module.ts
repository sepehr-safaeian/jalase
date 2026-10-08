import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionOrder,
  Workspace,
  WorkspaceMember,
} from './entities/subscription.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { SubscriptionsService } from './subscriptions.service.js';
import {
  SubscriptionsController,
  WorkspacesController,
} from './subscriptions.controller.js';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => PaymentsModule),
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionOrder,
      Workspace,
      WorkspaceMember,
      User,
    ]),
  ],
  controllers: [SubscriptionsController, WorkspacesController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
