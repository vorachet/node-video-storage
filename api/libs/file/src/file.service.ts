import { Injectable, Logger } from '@nestjs/common';
import * as S3 from 'aws-sdk/clients/s3';
import * as fs from 'fs';

const s3 = new S3({
  s3ForcePathStyle: true,
  accessKeyId: process.env.STORAGE_USERNAME || 'admin',
  secretAccessKey: process.env.STORAGE_PASSWORD || 'adminadmin',
  endpoint: process.env.STORAGE_ENDPOINT || `http://localhost:9000`,
  signatureVersion: 'v4',
});

export interface IFileUploadPayload {
  file: IFile;
}

export interface IFile {
  filename: string;
  buffer: any;
  size: number;
  mimetype: string;
}

export interface UploadResponse {
  error?: boolean;
  message?: string;
  contentUrl?: string;
  sizeInBytes?: number;
  objectKey?: string;
  buckets?: any;
  created?: Date;
}

export interface DownloadResponse {
  error?: boolean;
  message?: string;
  filePath?: string;
  tempDirPath?: string;
}

export interface DeleteResponse {
  error?: boolean;
  message?: string;
}

const BUCKET_NAME = 'files';

@Injectable()
export class FileService {
  logger = new Logger(FileService.name);

  async isConnected(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        await s3.listBuckets().promise();
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  }

  async getBuckets(): Promise<string[]> {
    return new Promise(async (resolve) => {
      try {
        const buckets = await s3.listBuckets().promise();
        resolve(buckets.Buckets.map((b) => b.Name));
      } catch (error) {
        resolve([]);
      }
    });
  }

  async uploadFileToStorage(
    payload: IFileUploadPayload,
  ): Promise<UploadResponse> {
    return new Promise(async (resolve) => {
      const objectKey = payload.file.filename;
      const file = payload.file;
      const sizeInBytes = file.size;

      try {
        await s3
          .upload({
            Bucket: BUCKET_NAME,
            Key: objectKey,
            Body: Buffer.from(file.buffer, 'binary'),
            ContentType: payload.file.mimetype,
          })
          .promise();
        resolve({
          error: false,
          message: 'File has been uploaded',
          contentUrl: `/${BUCKET_NAME}/${objectKey}`,
          sizeInBytes: sizeInBytes,
          objectKey: objectKey,
          created: new Date(),
        });
      } catch (e) {
        console.error('upload error = ', e);
        resolve({
          error: true,
          message: 'Unable to upload file',
        });
      }
    });
  }

  async download(
    fileid: string,
    tempFolderPath: string,
  ): Promise<DownloadResponse> {
    return new Promise(async (resolve) => {
      try {
        const file = await s3
          .getObject({
            Bucket: BUCKET_NAME,
            Key: fileid,
          })
          .promise();

        const filePath = tempFolderPath + '/' + fileid;
        this.logger.log('new temp file has been saved to ' + filePath);
        fs.writeFileSync(filePath, Buffer.from(file.Body as Uint8Array), {
          encoding: 'binary',
          flag: 'w',
        });
        resolve({
          error: false,
          filePath: filePath,
          tempDirPath: tempFolderPath,
        });
      } catch (e) {
        console.error('upload error = ', e);
        resolve({
          error: true,
          message: 'Unable to download file',
        });
      }
    });
  }

  async delete(objectKey: string): Promise<DeleteResponse> {
    return new Promise(async (resolve) => {
      try {
        const s3Job = await s3
          .deleteObject({
            Bucket: BUCKET_NAME,
            Key: objectKey,
          })
          .promise();

        if (!s3Job) {
          return resolve({
            error: true,
            message: 'Unable to delete file on cloud',
          });
        }

        return resolve({
          error: false,
          message: 'File has been deleted',
        });
      } catch (e) {
        console.error('delete error = ', e);
        return resolve({
          error: true,
          message: 'Unable to delete file',
        });
      }
    });
  }
}
