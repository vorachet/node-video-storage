import { DatabaseModule } from '../../../libs/database/src';
import { FileModule } from '../../../libs/file/src';
import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [DatabaseModule, FileModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
