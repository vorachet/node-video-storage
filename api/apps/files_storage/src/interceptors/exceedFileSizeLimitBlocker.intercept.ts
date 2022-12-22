import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Type,
  mixin,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export interface ExceedFileSizeLimitBlockerPayload {
  limitInBytes: number;
}

export function ExceedFileSizeLimitBlocker(
  payload: ExceedFileSizeLimitBlockerPayload,
): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    private logger = new Logger(ExceedFileSizeLimitBlocker.name);
    intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest();
      if (!request.file) {
        const message = 'Invalid multipart/form-data';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (!request.file.size) {
        const message = 'No content size data';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      const exceedFileLimit = request.file.size > payload.limitInBytes;
      if (exceedFileLimit) {
        const message = `Exceed media file size limit. Max ${payload.limitInBytes} bytes'`;
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      this.logger.log('validated');
      return next.handle();
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor;
}
