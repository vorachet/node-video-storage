import { spawn } from 'child_process';
import {
  OnQueueProgress,
  OnQueueCompleted,
  Processor,
  Process,
} from '@nestjs/bull';
import { Job, DoneCallback } from 'bull';
import { Logger } from '@nestjs/common';
import { FilesStorageService } from '../files_storage.service';
import { DownloadResponse } from '../../../../libs/file/src';
import * as fs from 'fs';
import * as os from 'os';
import { DatabaseService } from '../../../../libs/database/src';

const USER_HOME_DIR = os.homedir();
const TEMP_FOLDER_DIR = USER_HOME_DIR + '/.downloadTemp';
if (!fs.existsSync(TEMP_FOLDER_DIR)) {
  fs.mkdirSync(TEMP_FOLDER_DIR);
  console.log('Created TEMP_FOLDER_DIR at ' + TEMP_FOLDER_DIR);
}

@Processor('videoconvert')
export class VideoConvertersQueueConsumer {
  private readonly logger = new Logger(VideoConvertersQueueConsumer.name);
  constructor(
    private readonly db: DatabaseService,
    private readonly filesStorageService: FilesStorageService,
  ) {
    this.logger.log(`TEMP_FOLDER_DIR = ${TEMP_FOLDER_DIR}`);
  }

  @Process('convertMP4ToWEBM')
  async convertMP4ToWEBM(job: Job, cb: DoneCallback) {
    let resp: DownloadResponse;
    this.logger.log(`Start convertMP4ToWEBM`);

    if (job.data.fileid) {
      resp = await this.filesStorageService.download(
        job.data.fileid,
        TEMP_FOLDER_DIR,
      );
      if (resp.error) {
        const errorMessage = 'Unable to download temp file';
        this.logger.error(errorMessage);
        return cb(new Error(errorMessage), null);
      }

      job.progress(20);
      this.logger.log(`${job.data.fileid} .... 20%`);

      const srcFilePath = resp.filePath;
      const outputFilePath = resp.tempDirPath + '/' + job.data.fileid + '.webm';

      this.logger.log(`srcFilePath = ${srcFilePath}`);
      this.logger.log(`outputFilePath = ${outputFilePath}`);

      const cmd = [
        '-i',
        '"' + srcFilePath + '"',
        '-threads',
        '4',
        '-c:v',
        'libvpx',
        '-c:a',
        'libvorbis',
        ' -b:v',
        '400k',
        ' -b:a',
        '128k',
        '-quality',
        'good',
        '-qmin',
        '0',
        '-qmax',
        '55',
        '"' + outputFilePath + '"',
      ];
      this.logger.debug('ffmpeg' + cmd.join(' '));
      const ls = spawn('ffmpeg', cmd, {
        shell: true,
        env: process.env,
      });

      ls.on('close', async () => {
        job.progress(50);
        this.logger.log(`${job.data.fileid} .... 50%`);

        const replaceTask = await this.filesStorageService.replaceFileOnStorage(
          job.data.fileid,
          outputFilePath,
          'video/webm',
        );
        if (!replaceTask) {
          const errorMessage = 'Unable to replace file';
          this.logger.error(errorMessage);
          return cb(new Error(errorMessage), null);
        }

        const updateDuration =
          await this.filesStorageService.updateVideoDurationInfo(
            job.data.fileid,
            outputFilePath,
          );

        if (updateDuration > 0) {
          this.logger.verbose(
            'Updated video duration ' + updateDuration + ' secs',
          );
        }

        fs.renameSync(srcFilePath, srcFilePath + '.done');
        fs.renameSync(outputFilePath, outputFilePath + '.done');

        job.progress(100);
        this.logger.log(`${job.data.fileid} .... 100%`);

        cb(null, 'Done');
      });

      ls.stdout.on('data', (data) => {
        this.logger.verbose(`stdout: ${data}`);
      });

      ls.stderr.on('data', (data) => {
        this.logger.verbose(`${data}`);
      });
    } else {
      const errorMessage = 'Unable to find fileid';
      this.logger.error(errorMessage);
      return cb(new Error(errorMessage), null);
      return cb(new Error(errorMessage), null);
    }
  }

  @OnQueueProgress()
  onProgress(job: Job) {
    this.logger.log(
      `Progressing job ${job.id} of type ${
        job.name
      } with data ${job.progress()}%...`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(
      `Job completed ${job.id} of type ${job.name} with ${job.progress()}%...`,
    );
  }
}
