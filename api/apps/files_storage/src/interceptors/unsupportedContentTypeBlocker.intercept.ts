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

export interface UnsupportedContentTypeBlockerPayload {
  supportedMimeTypes: string[];
}

export function UnsupportedContentTypeBlocker(
  payload: UnsupportedContentTypeBlockerPayload,
): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    private logger = new Logger(UnsupportedContentTypeBlocker.name);

    isSupportedMimetype(type: string) {
      return payload.supportedMimeTypes.includes(type);
    }
    async intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest();
      if (!request.file) {
        const message = 'Invalid multipart/form-data';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (!request.file.mimetype || request.file.mimetype.length === 0) {
        const message = 'No content type';
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      if (!payload.supportedMimeTypes.includes(request.file.mimetype)) {
        const message = `${request.file.mimetype} not supported. List of supported content types: ${payload.supportedMimeTypes}`;
        this.logger.error(message);
        throw new HttpException(message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
      this.logger.log('validated');
      return next.handle();
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor;
}
