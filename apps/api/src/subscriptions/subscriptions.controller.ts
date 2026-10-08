import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/entities/user.entity.js';
import { PaymentsService } from '../payments/payments.service.js';
import { SubscriptionsService } from './subscriptions.service.js';
import {
  AddWorkspaceMemberDto,
  CreateAddonOrderDto,
  CreateOrderDto,
  CreateWorkspaceDto,
  InitPaymentDto,
  InitPaymentResponseDto,
  OrderSummaryDto,
  PlansCatalogResponseDto,
  SubscriptionSummaryDto,
  WorkspaceMemberSummaryDto,
  WorkspaceSummaryDto,
} from './dto/subscription.dto.js';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'کاتالوگ پلن‌ها و دوره‌های پرداخت' })
  @ApiResponse({ status: 200, type: PlansCatalogResponseDto })
  getPlans(): PlansCatalogResponseDto {
    return this.subscriptionsService.getCatalog();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اشتراک فعال کاربر' })
  @ApiResponse({ status: 200, type: SubscriptionSummaryDto })
  getMySubscription(
    @Req() req: Request & { user: User },
  ): Promise<SubscriptionSummaryDto> {
    return this.subscriptionsService.getSubscriptionSummary(req.user.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد سفارش اشتراک (قبل از پرداخت)' })
  @ApiResponse({ status: 201, type: OrderSummaryDto })
  createOrder(
    @Req() req: Request & { user: User },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderSummaryDto> {
    return this.subscriptionsService.createOrder(req.user.id, dto);
  }

  @Post('addon-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد سفارش افزونه (توربو)' })
  @ApiResponse({ status: 201, type: OrderSummaryDto })
  createAddonOrder(
    @Req() req: Request & { user: User },
    @Body() dto: CreateAddonOrderDto,
  ): Promise<OrderSummaryDto> {
    return this.subscriptionsService.createAddonOrder(req.user.id, dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'لیست سفارش‌های کاربر' })
  @ApiResponse({ status: 200, type: [OrderSummaryDto] })
  listOrders(
    @Req() req: Request & { user: User },
  ): Promise<OrderSummaryDto[]> {
    return this.subscriptionsService.listOrders(req.user.id);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جزئیات سفارش' })
  @ApiResponse({ status: 200, type: OrderSummaryDto })
  getOrder(
    @Req() req: Request & { user: User },
    @Param('id') orderId: string,
  ): Promise<OrderSummaryDto> {
    return this.subscriptionsService.getOrder(req.user.id, orderId);
  }

  @Post('orders/:id/pay/init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'شروع پرداخت زیبال برای سفارش' })
  @ApiResponse({ status: 201, type: InitPaymentResponseDto })
  initPayment(
    @Req() req: Request & { user: User },
    @Param('id') orderId: string,
    @Body() dto: InitPaymentDto,
  ): Promise<InitPaymentResponseDto> {
    return this.paymentsService.initiatePayment(
      req.user.id,
      orderId,
      dto.returnUrl,
    );
  }

  @Post('orders/:id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'تأیید پرداخت آزمایشی (فقط در حالت توسعه)',
  })
  @ApiResponse({ status: 201 })
  confirmPayment(
    @Req() req: Request & { user: User },
    @Param('id') orderId: string,
  ) {
    const allowSimulate =
      this.config.get<string>('NODE_ENV') === 'development' &&
      this.config.get<string>('ZIBAL_ALLOW_DEV_SIMULATE', 'false') === 'true';

    if (!allowSimulate) {
      throw new ForbiddenException(
        'پرداخت مستقیم غیرفعال است. از درگاه پرداخت استفاده کنید',
      );
    }

    return this.subscriptionsService.confirmOrderPayment(req.user.id, orderId);
  }

  @Post('free')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'بازگشت به پلن رایگان' })
  @ApiResponse({ status: 201, type: SubscriptionSummaryDto })
  switchToFree(
    @Req() req: Request & { user: User },
  ): Promise<SubscriptionSummaryDto> {
    return this.subscriptionsService.switchToFreePlan(req.user.id);
  }
}

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ساخت ورک‌اسپیس (پلن پرو)' })
  @ApiResponse({ status: 201, type: WorkspaceSummaryDto })
  createWorkspace(
    @Req() req: Request & { user: User },
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceSummaryDto> {
    return this.subscriptionsService.createWorkspace(req.user.id, dto.name);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ورک‌اسپیس‌های کاربر' })
  @ApiResponse({ status: 200, type: [WorkspaceSummaryDto] })
  listWorkspaces(
    @Req() req: Request & { user: User },
  ): Promise<WorkspaceSummaryDto[]> {
    return this.subscriptionsService.listWorkspaces(req.user.id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اعضای ورک‌اسپیس' })
  @ApiResponse({ status: 200, type: [WorkspaceMemberSummaryDto] })
  listMembers(
    @Req() req: Request & { user: User },
    @Param('id') workspaceId: string,
  ): Promise<WorkspaceMemberSummaryDto[]> {
    return this.subscriptionsService.listWorkspaceMembers(
      req.user.id,
      workspaceId,
    );
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'افزودن عضو به ورک‌اسپیس' })
  @ApiResponse({ status: 201, type: WorkspaceMemberSummaryDto })
  addMember(
    @Req() req: Request & { user: User },
    @Param('id') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ): Promise<WorkspaceMemberSummaryDto> {
    return this.subscriptionsService.addWorkspaceMember(
      req.user.id,
      workspaceId,
      dto.email,
      dto.role ?? 'member',
    );
  }
}
