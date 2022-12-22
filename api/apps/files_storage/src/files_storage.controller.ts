import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile as NestJSUploadedFile,
  HttpException,
  HttpStatus,
  Res,
  Logger,
  Delete,
  HttpCode,
  Param,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FilesStorageService } from './files_storage.service';
import { FileInterceptor as FileUploadHandler } from '@nestjs/platform-express/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExceedFileSizeLimitBlocker } from './interceptors/exceedFileSizeLimitBlocker.intercept';
import { UnsupportedContentTypeBlocker } from './interceptors/unsupportedContentTypeBlocker.intercept';
import {
  DuplicateVerificationModes,
  FileExistsBlockInterceptor,
} from './interceptors/fileExistsBlock.intercept';
import { UploadResponse } from '../../../libs/file/src';
import { FindSpec } from './entities/findSpec';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
//import * as https from 'https';
//import * as http from 'http';
//import * as url from 'url';
import { ApiCallLogger } from './interceptors/apiCallLogger.intercept';
import { FileUploadedEvent } from '../../../apps/events/src/events/fileUploadedEvent.event';
import { JWTGuard } from '../../../apps/auth/src/guards/jwt.guard';
import { UploadedFile } from './entities/uploadedFile.entity';

@Controller({
  version: process.env.FILES_STORAGE_VERSION || '1',
})
@ApiTags('files')
export class FilesStorageController {
  private logger = new Logger(FilesStorageController.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly filesStorageService: FilesStorageService,
    @InjectQueue('videoconvert') private videoConverterQueue: Queue,
  ) {}

  getHello() {
    return 'Hello World!'; 
  }

  @Post('files')
  @ApiBearerAuth()
  @UseGuards(JWTGuard)
  @UseInterceptors(
    FileUploadHandler('data'),
    ApiCallLogger('POST /files'),
    ExceedFileSizeLimitBlocker({ limitInBytes: 15 * 1024 * 1024 }),
    UnsupportedContentTypeBlocker({
      supportedMimeTypes: ['video/mp4'],
    }),
    FileExistsBlockInterceptor(DuplicateVerificationModes.BY_MD5),
  )
  @ApiResponse({
    status: 201,
    description: 'File uploaded',
    headers: {
      Location: {
        schema: {
          type: 'string',
        },
        description: 'Created file location',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 409,
    description: 'File exists',
  })
  @ApiResponse({
    status: 415,
    description: 'Unsupported Media Type',
  })
  @ApiOperation({
    description: 'Upload a video file',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @NestJSUploadedFile('file') file: Express.Multer.File,
    @Req() req,
    @Res() res,
  ) {
    const task: UploadResponse = await this.filesStorageService.upload({
      file: file,
      userId: req.token.userId,
    });

    if (task.error) {
      const message = task.message;
      this.logger.error(message);
      throw new HttpException(task.message, HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Uploaded ${task.contentUrl}`);

    this.logger.log(`Sending webm transformation task to Queue`);

    await this.videoConverterQueue.add('convertMP4ToWEBM', {
      fileid: task.objectKey,
    });

    this.logger.log(`Tranformation task has been accepted by Queue`);

    this.eventEmitter.emit(
      'file.uploaded',
      new FileUploadedEvent({
        fileid: task.objectKey,
        created: new Date(),
      }),
    );

    return res
      .set({ Location: `${process.env.STORAGE_ENDPOINT}${task.contentUrl}` })
      .json({ Location: `${process.env.STORAGE_ENDPOINT}${task.contentUrl}` });
  }

  @Delete('files/:fileid')
  @ApiBearerAuth()
  @UseGuards(JWTGuard)
  @UseInterceptors(ApiCallLogger('DELETE /files/:fileid'))
  @ApiOperation({
    description: 'Delete a video file',
  })
  @ApiResponse({
    status: 204,
    description: 'File was successfully removed',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @HttpCode(204)
  async deleteFileByFileId(@Param('fileid') fileid: string) {
    const file = await this.filesStorageService.findOneByFileId(fileid);
    if (!file) {
      const errorMessage = 'File not found';
      this.logger.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
    const errorMessage = await this.filesStorageService.delete(fileid);
    if (errorMessage) {
      const message = errorMessage;
      this.logger.error(message);
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
    return {};
  }

  @Get('files')
  @ApiBearerAuth()
  @UseGuards(JWTGuard)
  @UseInterceptors(ApiCallLogger('GET /files'))
  @ApiOperation({
    description: 'List of uploaded files',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matched uploaded files',
    type: UploadedFile,
    isArray: true,
  })
  async getFiles(@Query() spec: FindSpec): Promise<UploadedFile[]> {
    return await this.filesStorageService.find(spec);
  }

  @Get('files/:fileid')
  @ApiBearerAuth()
  @UseGuards(JWTGuard)
  @UseInterceptors(ApiCallLogger('GET /files/:fileid'))
  @ApiOperation({
    description:
      'Download a video file by fileid. The file name will be restored as it was when you uploaded it',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UploadedFile,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async getFileByFileId(
    @Param('fileid') fileid: string,
  ): Promise<UploadedFile> {
    const file = await this.filesStorageService.findOneByFileId(fileid);
    if (!file) {
      const errorMessage = 'File not found';
      this.logger.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
    return file;
  }

  /*
  @Get('stream/:fileid')
  @ApiBearerAuth()
  @UseGuards(JWTGuard)
  @UseInterceptors(ApiCallLogger('GET /stream/:fileid'))
  @ApiOperation({
    description:
      'Access a video stream by fileid. The file name will be restored as it was when you uploaded it',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    content: {
      'video/mp4': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'video/webm': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async streamWithId(@Res() res, @Param('fileid') fileid: string) {
    const file = await this.filesStorageService.findOneByFileId(fileid);
    if (!file) {
      const errorMessage = 'File not found';
      this.logger.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
    const protocol = url.parse(file.url).protocol == 'https:' ? https : http;
    protocol.get(file.url, (stream) => {
      stream.pipe(res);
    });
  }*/
}
