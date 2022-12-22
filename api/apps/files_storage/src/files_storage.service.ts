import { DatabaseService } from '../../../libs/database/src';
import {
  DeleteResponse,
  DownloadResponse,
  FileService,
  UploadResponse,
} from '../../../libs/file/src';
import { Injectable, Logger } from '@nestjs/common';
import { FindSpec } from './entities/findSpec';
import { cleanUpText, generateStandardFilename } from './utils/textTasks';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as md5 from 'md5';
import { UploadedFile } from './entities/uploadedFile.entity';

export interface UploadFilePayload {
  file: Express.Multer.File;
  userId: string;
}

@Injectable()
export class FilesStorageService {
  private logger = new Logger(FilesStorageService.name);
  constructor(
    private readonly db: DatabaseService,
    private readonly file: FileService,
  ) {}

  async upload(payload: UploadFilePayload): Promise<UploadResponse> {
    const fileid = generateStandardFilename();
    const fileMD5Value = md5(payload.file.buffer);
    const storageTask: UploadResponse = await this.file.uploadFileToStorage({
      file: {
        filename: fileid,
        buffer: payload.file.buffer,
        size: payload.file.size,
        mimetype: payload.file.mimetype,
      },
    });

    if (storageTask.error) {
      return storageTask;
    }

    const dbTask = await this.db.getFilesCollection().updateOne(
      {
        _id: fileid as any,
      },
      {
        $set: new UploadedFile({
          fileid: fileid,
          name: fileid,
          md5: fileMD5Value,
          original_md5: fileMD5Value,
          original_mimetype: payload.file.mimetype,
          original_size: storageTask.sizeInBytes,
          size: storageTask.sizeInBytes,
          created_at: storageTask.created,
          userId: payload.userId || 'unknown',
          duration: 0,
          url: `http://localhost:9000${storageTask.contentUrl}`,
          mimetype: payload.file.mimetype,
        }),
      },
      {
        upsert: true,
      },
    );

    if (!dbTask.acknowledged) {
      storageTask.error = true;
      storageTask.message = 'Unable to write database';
      return storageTask;
    }

    return storageTask;
  }

  async replaceFileOnStorage(
    fileid: string,
    newFilePath: string,
    newMimetype: string,
  ): Promise<UploadedFile> {
    const file = {
      file: {
        filename: fileid,
        buffer: fs.readFileSync(newFilePath),
        size: fs.statSync(newFilePath).size,
        mimetype: newMimetype,
      },
    };
    const storageTask: UploadResponse = await this.file.uploadFileToStorage(
      file,
    );

    if (storageTask.error) {
      return null;
    }
    const newMD5 = md5(file.file.buffer);
    const replacedFile = new UploadedFile({
      size: storageTask.sizeInBytes,
      md5: newMD5,
      created_at: storageTask.created,
      url: `http://localhost:9000${storageTask.contentUrl}`,
      mimetype: newMimetype,
    });

    const dbTask = await this.db.getFilesCollection().updateOne(
      {
        _id: fileid as any,
      },
      {
        $set: replacedFile,
      },
      {
        upsert: true,
      },
    );

    if (!dbTask.acknowledged) {
      return null;
    }

    return replacedFile;
  }

  async updateVideoDurationInfo(
    fileid: string,
    videoFilePath: string,
  ): Promise<number> {
    const duration = await this.extractVideoDuration(videoFilePath);
    const task = await this.db.getFilesCollection().updateOne(
      {
        _id: fileid as any,
      },
      {
        $set: {
          duration: duration,
        },
      },
      {
        upsert: true,
      },
    );
    return task.acknowledged ? duration : -1;
  }

  async download(
    fileid: string,
    tempFolderPath: string,
  ): Promise<DownloadResponse> {
    return await this.file.download(fileid, tempFolderPath);
  }

  private async extractVideoDuration(videoFilePath: string): Promise<number> {
    return new Promise((resolve) => {
      const cmd = [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of ',
        'default=noprint_wrappers=1:nokey=1',
        '"' + videoFilePath + '"',
      ];
      const ls = spawn('ffprobe', cmd, {
        shell: true,
        env: process.env,
      });

      ls.stdout.on('data', (duration) => {
        const durationText = cleanUpText(Buffer.from(duration).toString());
        try {
          const durationNumber = parseFloat(durationText);
          this.logger.log('extracted duration = ' + durationNumber);
          resolve(durationNumber);
        } catch (error) {
          resolve(0);
        }
      });
    });
  }

  async delete(fileid: string): Promise<string> {
    const dbTask = await this.db.getFilesCollection().deleteOne({
      _id: fileid as any,
    });

    if (!dbTask.acknowledged) {
      const errorMessage = 'Unable to delete video metadata';
      this.logger.error(errorMessage);
      return errorMessage;
    }

    const fileTask: DeleteResponse = await this.file.delete(fileid);
    if (fileTask.error) {
      const errorMessage = fileTask.message;
      this.logger.error(errorMessage);
      return errorMessage;
    }

    return null;
  }

  async isIdenticalMD5(md5: string): Promise<boolean> {
    const file = await this.db.getFilesCollection().findOne({
      original_md5: md5,
    });
    return file ? true : false;
  }

  async findOneByFileId(fileid: string): Promise<UploadedFile> {
    return (await this.db.getFilesCollection().findOne(
      {
        _id: fileid,
      },
      { projection: { _id: 0 } },
    )) as unknown as UploadedFile;
  }

  async findOneByName(name: string): Promise<UploadedFile> {
    return (await this.db.getFilesCollection().findOne({
      name: name,
    })) as unknown as UploadedFile;
  }

  private intConvert(text: string): number {
    if (!text || text.length == 0) return 0;
    try {
      return parseInt(text);
    } catch (error) {
      return 0;
    }
  }

  private floatConvert(text: string): number {
    if (!text || text.length == 0) return 0;
    try {
      return parseFloat(text);
    } catch (error) {
      return 0;
    }
  }

  async find(findSpec: FindSpec): Promise<UploadedFile[]> {
    const limit = this.intConvert(findSpec.limit);
    const skip = this.intConvert(findSpec.skip);
    const duration = this.floatConvert(findSpec.minDuration + ''); // NestJS seems not convert the query property type corretly for number type

    const byDurationSpec =
      findSpec.minDuration && findSpec.minDuration >= 0
        ? {
            duration: {
              $gte: duration,
            },
          }
        : {};
    const byContentTypeSpec =
      findSpec.contentType && findSpec.contentType.length > 0
        ? {
            mimetype: {
              $regex: new RegExp(`${findSpec.contentType}`),
            },
          }
        : {};
    const byNameSpec =
      findSpec.name && findSpec.name.length > 0
        ? {
            name: {
              $regex: new RegExp(`${findSpec.name}`),
            },
          }
        : {};
    const spec = {
      ...byContentTypeSpec,
      ...byNameSpec,
      ...byDurationSpec,
    };
    this.logger.log(`find( ${JSON.stringify(spec)} )`);
    return (await this.db
      .getFilesCollection()
      .find(spec, { projection: { _id: 0 } })
      .limit(limit)
      .skip(skip)
      .sort(findSpec.sort ? findSpec.sort : {})
      .toArray()) as unknown as UploadedFile[];
  }
}
