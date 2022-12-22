import { DatabaseModule } from '../../../libs/database/src';
import { FileModule } from '../../../libs/file/src';
import { Module } from '@nestjs/common';
import { FilesStorageController } from './files_storage.controller';
import { FilesStorageService } from './files_storage.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { VideoConvertersQueueConsumer } from './queues/videoConvertersQueue.qproc';
import { CleanupTempFolderCronJob } from './cronjobs/cleanupTempFolder.cron';
import { AuthModule } from '../../../apps/auth/src/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'videoconvert',
    }),
    DatabaseModule,
    FileModule,
    AuthModule,
  ],
  controllers: [FilesStorageController],
  providers: [
    FilesStorageService,
    VideoConvertersQueueConsumer,
    CleanupTempFolderCronJob,
  ],
})
export class FilesStorageModule {}
