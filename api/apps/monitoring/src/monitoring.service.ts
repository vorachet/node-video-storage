import { DatabaseService } from '../../../libs/database/src';
import { FileService } from '../../../libs/file/src';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MonitoringService {
  private logger = new Logger(MonitoringService.name);
  constructor(
    private readonly db: DatabaseService,
    private readonly file: FileService,
  ) {}

  async health(): Promise<string[]> {
    const errors = [];
    if (!this.db.isConnected()) {
      errors.push('Unable to connect database');
    }
    if (!(await this.file.isConnected())) {
      errors.push('Unable to connect storage');
    }

    if (errors.length > 0) {
      this.logger.error(errors);
      return errors;
    }

    this.logger.log('service ok');
    return [];
  }
}
