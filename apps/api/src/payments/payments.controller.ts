import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('zibal/callback')
  @ApiOperation({
    summary: 'Callback زیبال (بازگشت کاربر پس از پرداخت)',
    description:
      'زیبال پس از پرداخت کاربر را به این آدرس با query string هدایت می‌کند. سرور پرداخت را verify می‌کند و کاربر را به اپ برمی‌گرداند.',
  })
  @ApiQuery({ name: 'trackId', required: false })
  @ApiQuery({ name: 'success', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiResponse({ status: 302, description: 'Redirect به صفحه نتیجه در اپ' })
  async zibalCallback(
    @Res() res: Response,
    @Query('trackId') trackId?: string,
    @Query('success') success?: string,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
  ): Promise<void> {
    const redirectUrl = await this.paymentsService.handleCallback({
      trackId,
      success,
      status,
      orderId,
    });
    res.redirect(302, redirectUrl);
  }

  @Get('zibal/start/:trackId')
  @ApiOperation({
    summary: 'انتقال به درگاه زیبال (با Referer صحیح)',
    description:
      'صفحه میانی برای موبایل و وب که کاربر را به درگاه زیبال هدایت می‌کند.',
  })
  @ApiResponse({ status: 302, description: 'Redirect به درگاه زیبال' })
  async zibalStart(
    @Param('trackId') trackId: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.paymentsService.assertTrackIdForStart(trackId);
    res.redirect(
      302,
      this.paymentsService.getZibalGatewayStartUrl(trackId),
    );
  }
}
