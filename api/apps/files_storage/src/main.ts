import { Logger } from '@nestjs/common';
import { bootstrapOpenApi } from 'apps/bootstrap';
import { FilesStorageModule } from './files_storage.module';

bootstrapOpenApi({
  module: FilesStorageModule,
  name: 'Files Storage API',
  logger: new Logger('Files Storage API'),
  port: 8080,
});
