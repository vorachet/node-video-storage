import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCallLogger } from '../../../apps/files_storage/src/interceptors/apiCallLogger.intercept';
import { MonitoringService } from './monitoring.service';

@Controller({
  version: '1',
})
@ApiTags('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @UseInterceptors(ApiCallLogger('GET /health'))
  @ApiResponse({
    status: 200,
    description: 'OK',
  })
  @ApiResponse({
    status: 500,
    description: 'Check message to understand service error state',
  })
  @ApiOperation({
    description:
      'Return the health of the service as HTTP 200 status. Useful to check if everything is configured correctly.',
  })
  health() {
    return 'OK';
  }

  @Get('health-resources')
  @UseInterceptors(ApiCallLogger('GET /health-resources'))
  @ApiResponse({
    status: 200,
    description: 'OK',
  })
  @ApiResponse({
    status: 500,
    description: 'Check message to understand service error state',
  })
  @ApiOperation({
    description:
      'Return the health of the service as HTTP 200 status. Useful to check if everything is configured correctly.',
  })
  async healthWithResources(): Promise<string> {
    const error = await this.monitoringService.health();
    if (error.length > 0) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return 'OK';
  }
}
