import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'اطلاعات پایه API' })
  @ApiResponse({ status: 200, description: 'نام و نسخه سرویس' })
  getInfo() {
    return this.appService.getInfo();
  }
}
