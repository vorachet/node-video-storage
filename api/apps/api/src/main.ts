import { Logger } from '@nestjs/common';
import { bootstrapOpenApi } from 'apps/bootstrap';
import { ApiModule } from './api.module';

bootstrapOpenApi({
  module: ApiModule,
  name: 'Video Storage API',
  logger: new Logger('Video Storage API'),
  port: 8080,
});
