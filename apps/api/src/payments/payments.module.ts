import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionOrder } from '../subscriptions/entities/subscription.entity.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { User } from '../auth/entities/user.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { ZibalService } from './zibal/zibal.service.js';

@Module({
  imports: [
    forwardRef(() => SubscriptionsModule),
    TypeOrmModule.forFeature([SubscriptionOrder, User]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ZibalService],
  exports: [PaymentsService, ZibalService],
})
export class PaymentsModule {}
