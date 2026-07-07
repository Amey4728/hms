import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { ResponseMessage } from './common/decorators/response-message.decorator';

@ApiTags('Meta')
@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  @ResponseMessage('HMS API')
  @ApiOperation({ summary: 'API information and useful links' })
  info() {
    const prefix = this.config.getOrThrow<string>('app.apiPrefix');
    const version = this.config.getOrThrow<string>('app.apiVersion');
    const base = `/${prefix}/${version}`;
    return {
      name: 'HMS API',
      description: 'Enterprise Hospital Management System',
      apiVersion: version,
      environment: this.config.getOrThrow<string>('app.env'),
      links: {
        docs: '/docs',
        health: `${base}/health`,
        login: `${base}/auth/login`,
      },
    };
  }
}
