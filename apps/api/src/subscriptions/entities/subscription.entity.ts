import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { BillingPeriodKey, PlanKey, AddonKey, OrderType } from '@jalase/shared';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'plan_key', type: 'varchar', length: 20 })
  planKey!: PlanKey;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'expired' | 'cancelled';

  @Column({ name: 'billing_period_key', type: 'varchar', length: 10, nullable: true })
  billingPeriodKey!: BillingPeriodKey | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'ai_usage_count', type: 'int', default: 0 })
  aiUsageCount!: number;

  @Column({ name: 'ai_usage_period_start', type: 'timestamptz', nullable: true })
  aiUsagePeriodStart!: Date | null;

  @Column({ name: 'has_turbo', type: 'boolean', default: false })
  hasTurbo!: boolean;

  @Column({ name: 'turbo_expires_at', type: 'timestamptz', nullable: true })
  turboExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('subscription_orders')
export class SubscriptionOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'order_type', type: 'varchar', length: 10, default: 'plan' })
  orderType!: OrderType;

  @Column({ name: 'plan_key', type: 'varchar', length: 20, nullable: true })
  planKey!: PlanKey | null;

  @Column({ name: 'addon_key', type: 'varchar', length: 20, nullable: true })
  addonKey!: AddonKey | null;

  @Column({ name: 'billing_period_key', type: 'varchar', length: 10 })
  billingPeriodKey!: BillingPeriodKey;

  @Column({ type: 'varchar', length: 30, default: 'pending_payment' })
  status!: 'pending_payment' | 'paid' | 'cancelled' | 'failed';

  @Column({ name: 'amount_toman', type: 'int' })
  amountToman!: number;

  @Column({ name: 'months_paid', type: 'int' })
  monthsPaid!: number;

  @Column({ name: 'months_granted', type: 'int' })
  monthsGranted!: number;

  @Column({ type: 'varchar', length: 8, default: 'IRT' })
  currency!: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId!: string | null;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'payment_reference', type: 'varchar', length: 255, nullable: true })
  paymentReference!: string | null;

  @Column({ name: 'gateway_track_id', type: 'varchar', length: 32, nullable: true })
  gatewayTrackId!: string | null;

  @Column({ name: 'gateway_status', type: 'int', nullable: true })
  gatewayStatus!: number | null;

  @Column({ name: 'gateway_card_number', type: 'varchar', length: 32, nullable: true })
  gatewayCardNumber!: string | null;

  @Column({ name: 'payment_return_url', type: 'varchar', length: 512, nullable: true })
  paymentReturnUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: 'owner' | 'admin' | 'member';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
