import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ApiCalledEvent } from '../events/apiCalledEvent.event';

@Injectable()
export class ApiUsagesListener {
  private logger = new Logger(ApiUsagesListener.name);
  @OnEvent('api.called')
  apiCalled(event: ApiCalledEvent) {
    this.logger.verbose('api.called');
  }
}
