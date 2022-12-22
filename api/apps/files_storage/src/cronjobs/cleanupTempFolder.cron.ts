import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getTempFolderPath } from '../utils/fileSystem';
import * as fs from 'fs';

const TEMP_FOLDER_DIR = getTempFolderPath();

@Injectable()
export class CleanupTempFolderCronJob {
  private readonly logger = new Logger(CleanupTempFolderCronJob.name);

  @Cron(process.env.DELETE_TEMP_FILE_CRONJOB || CronExpression.EVERY_10_MINUTES)
  handleCron() {
    this.logger.debug('Deleting *.done files');
    const regex = /[.]done$/;
    const files: string[] = fs
      .readdirSync(TEMP_FOLDER_DIR)
      .filter((f) => regex.test(f));
    this.logger.debug(
      `Found  ${files.length} Done Files at ${TEMP_FOLDER_DIR}`,
    );
    files.map((f) => {
      const target = TEMP_FOLDER_DIR + '/' + f;
      fs.unlinkSync(target);
      this.logger.verbose(`Deleted ${target}`);
    });
  }
}
