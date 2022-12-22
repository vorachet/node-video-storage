import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileUploadedEvent } from '../events/fileUploadedEvent.event';

@Injectable()
export class FileChangesListener {
  private logger = new Logger(FileChangesListener.name);
  @OnEvent('file.uploaded')
  fileUploaded(event: FileUploadedEvent) {
    this.logger.verbose('file.uploaded');
  }
}
