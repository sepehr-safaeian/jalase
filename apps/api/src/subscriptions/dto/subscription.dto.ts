import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import type {
  AddonDefinition,
  AddonKey,
  BillingPeriodDefinition,
  BillingPeriodKey,
  OrderType,
  PlanDefinition,
  PlanKey,
} from '@jalase/shared';

export class PlanFeatureDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  included!: boolean;
}

export class PlanResponseDto implements PlanDefinition {
  @ApiProperty({ enum: ['free', 'plus', 'pro'] })
  key!: PlanKey;

  @ApiProperty()
  tier!: PlanDefinition['tier'];

  @ApiProperty()
  name!: string;

  @ApiProperty()
  tagline!: string;

  @ApiProperty()
  monthlyPriceToman!: number;

  @ApiPropertyOptional({ nullable: true })
  aiMonthlyLimit!: number | null;

  @ApiProperty({ type: [PlanFeatureDto] })
  features!: PlanFeatureDto[];

  @ApiProperty({ type: [String] })
  meetingIntegrations!: string[];
}

export class AddonResponseDto implements AddonDefinition {
  @ApiProperty({ enum: ['turbo'] })
  key!: AddonKey;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  tagline!: string;

  @ApiProperty()
  monthlyPriceToman!: number;

  @ApiProperty()
  requiresPaidPlan!: boolean;

  @ApiProperty({ type: [PlanFeatureDto] })
  features!: PlanFeatureDto[];
}

export class BillingPeriodResponseDto implements BillingPeriodDefinition {
  @ApiProperty({ enum: ['3m', '6m', '1y'] })
  key!: BillingPeriodKey;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  monthsPaid!: number;

  @ApiProperty()
  monthsGranted!: number;

  @ApiPropertyOptional()
  badge?: string;
}

export class PlansCatalogResponseDto {
  @ApiProperty({ type: [PlanResponseDto] })
  plans!: PlanResponseDto[];

  @ApiProperty({ type: [AddonResponseDto] })
  addons!: AddonResponseDto[];

  @ApiProperty({ type: [BillingPeriodResponseDto] })
  billingPeriods!: BillingPeriodResponseDto[];
}

export class SubscriptionSummaryDto {
  @ApiProperty({ enum: ['free', 'plus', 'pro'] })
  planKey!: PlanKey;

  @ApiProperty()
  tier!: PlanDefinition['tier'];

  @ApiProperty({ enum: ['active', 'expired', 'cancelled'] })
  status!: 'active' | 'expired' | 'cancelled';

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiProperty()
  aiUsageCount!: number;

  @ApiPropertyOptional({ nullable: true })
  aiMonthlyLimit!: number | null;

  @ApiPropertyOptional({ enum: ['3m', '6m', '1y'], nullable: true })
  billingPeriodKey!: BillingPeriodKey | null;

  @ApiProperty()
  hasTurbo!: boolean;

  @ApiPropertyOptional({ nullable: true })
  turboExpiresAt!: string | null;
}

export class OrderSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['plan', 'addon'] })
  orderType!: OrderType;

  @ApiPropertyOptional({ enum: ['free', 'plus', 'pro'], nullable: true })
  planKey!: PlanKey | null;

  @ApiPropertyOptional({ enum: ['turbo'], nullable: true })
  addonKey!: AddonKey | null;

  @ApiProperty({ enum: ['3m', '6m', '1y'] })
  billingPeriodKey!: BillingPeriodKey;

  @ApiProperty({
    enum: ['pending_payment', 'paid', 'cancelled', 'failed'],
  })
  status!: 'pending_payment' | 'paid' | 'cancelled' | 'failed';

  @ApiProperty()
  amountToman!: number;

  @ApiProperty()
  monthsPaid!: number;

  @ApiProperty()
  monthsGranted!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: string | null;
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['plus', 'pro'] })
  @IsEnum(['plus', 'pro'])
  planKey!: PlanKey;

  @ApiProperty({ enum: ['3m', '6m', '1y'] })
  @IsEnum(['3m', '6m', '1y'])
  billingPeriodKey!: BillingPeriodKey;
}

export class CreateAddonOrderDto {
  @ApiProperty({ enum: ['turbo'] })
  @IsEnum(['turbo'])
  addonKey!: AddonKey;

  @ApiProperty({ enum: ['3m', '6m', '1y'] })
  @IsEnum(['3m', '6m', '1y'])
  billingPeriodKey!: BillingPeriodKey;
}

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'تیم محصول' })
  @IsString()
  @Length(2, 100)
  name!: string;
}

export class AddWorkspaceMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ['admin', 'member'], default: 'member' })
  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';
}

export class WorkspaceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['owner', 'admin', 'member'] })
  role!: 'owner' | 'admin' | 'member';

  @ApiProperty()
  memberCount!: number;
}

export class WorkspaceMemberSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;

  @ApiProperty({ enum: ['owner', 'admin', 'member'] })
  role!: 'owner' | 'admin' | 'member';
}

export class InitPaymentDto {
  @ApiPropertyOptional({
    description: 'آدرس بازگشت پس از پرداخت (وب یا deep link jalase://)',
    example: 'http://localhost:8081/subscription/result',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class InitPaymentResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'آدرس انتقال به درگاه (null اگر قبلا پرداخت شده)',
  })
  paymentUrl!: string | null;

  @ApiProperty()
  trackId!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  amountToman!: number;

  @ApiProperty()
  alreadyPaid!: boolean;
}
