import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Type,
  mixin,
  Injectable,
} from '@nestjs/common';
import { ApiCalledEvent } from '../../../events/src/events/apiCalledEvent.event';

export function ApiCallLogger(operation: string): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private logger = new Logger(ApiCallLogger.name);
    constructor(private readonly eventEmitter: EventEmitter2) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
      this.eventEmitter.emit(
        'api.called',
        new ApiCalledEvent({
          operation: operation,
          created: new Date(),
        }),
      );
      return next.handle();
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor;
}
