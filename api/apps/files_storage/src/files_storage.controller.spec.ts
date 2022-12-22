import { DatabaseModule } from '../../../libs/database/src';
import { FileModule } from '../../../libs/file/src';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../../../apps/auth/src/auth.module';
import { FilesStorageController } from './files_storage.controller';
import { FilesStorageService } from './files_storage.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

describe('FilesStorageController', () => {
  let filesStorageController: FilesStorageController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FilesStorageController],
      providers: [FilesStorageService],
      imports: [
        DatabaseModule,
        FileModule,
        AuthModule,
        EventEmitterModule.forRoot(),
        BullModule.forRoot({
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: 6379,
            password: process.env.REDIS_PASSWORD || '',
          },
        }),
        BullModule.registerQueue({
          name: 'videoconvert',
        }),
      ],
    }).compile();

    filesStorageController = app.get<FilesStorageController>(
      FilesStorageController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(filesStorageController.getHello()).toBe('Hello World!');
    });

    it('should return "Hello World2!"', () => {
      expect(filesStorageController.getHello()).toBe('Hello World!');
    });
  });
});
