import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Type,
  mixin,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FilesStorageService } from '../files_storage.service';
import * as md5 from 'md5';

export enum DuplicateVerificationModes {
  BY_MD5,
}
export function FileExistsBlockInterceptor(
  verificationMode: DuplicateVerificationModes,
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private logger = new Logger(FileExistsBlockInterceptor.name);
    constructor(private readonly filesStorageService: FilesStorageService) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest();

      if (!request.file) {
        const message = 'Invalid multipart/form-data.';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (
        !request.file.originalname ||
        request.file.originalname.length === 0
      ) {
        const message = 'Content filename cannot be empty.';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (!request.file.buffer) {
        const message = 'Content file content cannot be empty.';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (verificationMode == DuplicateVerificationModes.BY_MD5) {
        const uploadedMD5 = md5(request.file.buffer);
        if (await this.filesStorageService.isIdenticalMD5(uploadedMD5)) {
          const message = 'File exists. (Checked by MD5 digest)';
          this.logger.error(message);
          throw new HttpException(message, HttpStatus.CONFLICT);
        }

        this.logger.log('validated');
        return next.handle();
      } else {
        const message = 'Verification mode not supported';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.CONFLICT);
      }
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor;
}
