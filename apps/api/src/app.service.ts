import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getInfo() {
    return {
      name: 'جلسه',
      version: '0.1.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
    };
  }
}
