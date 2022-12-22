import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsModule } from '../../events/src/events.module';
import { FilesStorageModule } from '../../files_storage/src/files_storage.module';
import { MonitoringModule } from '../../monitoring/src/monitoring.module';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from '../../../apps/auth/src/auth.module';

@Module({
  imports: [
    AuthModule,
    FilesStorageModule,
    EventsModule,
    MonitoringModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    EventEmitterModule.forRoot(),
  ],
})
export class ApiModule {}
