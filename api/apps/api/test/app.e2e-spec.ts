import * as dotenv from 'dotenv';
dotenv.config();
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiModule } from './../src/api.module';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';

const _1MB_MP4 = __dirname + '/../../../testData/1MB.mp4';
const _2MB_MP4 = __dirname + '/../../../testData/2MB.mp4';
const _5MB_MP4 = __dirname + '/../../../testData/5MB.mp4';
const _10MB_MP4 = __dirname + '/../../../testData/10MB.mp4';
const _20MB_MP4 = __dirname + '/../../../testData/20MB.mp4';
const e2e_MP4 = __dirname + '/../../../testData/e2e.mp4';

process.env.DATABASE_NAME = 'storage_test';
const DATABASE_URL =
  process.env.DATABASE_URL || `mongodb://admin:adminadmin@localhost`;
const MONGO_CONNECTION_TIMEOUT_MS = 5000;
const MONGO_MIN_POOL_SIZE = 10;
const MONGO_MAX_POOL_SIZE = 100;

const FILES = {
  _1MB: {
    filename: path.basename(_1MB_MP4),
    buffer: fs.readFileSync(_1MB_MP4),
  },
  _2MB: {
    filename: path.basename(_2MB_MP4),
    buffer: fs.readFileSync(_2MB_MP4),
  },
  _5MB: {
    filename: path.basename(_5MB_MP4),
    buffer: fs.readFileSync(_5MB_MP4),
  },
  _10MB: {
    filename: path.basename(_10MB_MP4),
    buffer: fs.readFileSync(_10MB_MP4),
  },
  _20MB: {
    filename: path.basename(_20MB_MP4),
    buffer: fs.readFileSync(_20MB_MP4),
  },
  e2e: {
    filename: path.basename(e2e_MP4),
    buffer: fs.readFileSync(e2e_MP4),
  },
};

describe('ApiController (e2e)', () => {
  let app: INestApplication;
  const userId = 'TestUserId';
  const password = 'TestPassword';
  let token = '';
  let getFiles = [];
  let getFile;
  const connection: mongoose.Connection = mongoose.connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning();
    await app.init();

    const files: mongoose.Collection = connection
      .useDb(process.env.DATABASE_NAME)
      .collection('files');
    const delTask = await files.deleteMany({});
    console.log(
      `${delTask.acknowledged ? 'deleted' : 'error on delete'} test data`,
    );
  });

  describe('Monitoring Services', () => {
    it('/v1/health', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(HttpStatus.OK);
    });
  });

  describe('Auth Services', () => {
    it('/v1/generateToken POST | with valid mockup account | Expected CREATED', (done) => {
      request(app.getHttpServer())
        .post('/v1/generateToken')
        .send({ userId: userId, password: password })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          token = response.text;
          done();
        });
    });

    it('/v1/generateToken POST | with invalid mockup account | Expected FORBIDDEN', () => {
      return request(app.getHttpServer())
        .post('/v1/generateToken')
        .send({ userId: null, password: null })
        .expect(HttpStatus.FORBIDDEN);
    });

    it(`/v1/verifyToken/[TOKEN] GET | Valid Token | Expected OK`, () => {
      return request(app.getHttpServer())
        .get(`/v1/verifyToken/${token}`)
        .expect(HttpStatus.OK);
    });

    it(`/v1/verifyToken[TOKEN] GET | Invalid Token | Expected FORBIDDEN`, () => {
      return request(app.getHttpServer())
        .get(`/v1/verifyToken/BADTOKEN`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('FilesStorage Services', () => {
    it('/v1/files POST | No Token | Expected FORBIDDEN', () => {
      return request(app.getHttpServer())
        .post('/v1/files')
        .set('Authorization', 'bearer ')
        .send()
        .expect(HttpStatus.FORBIDDEN);
    });

    it('/v1/files POST | Non MP4 file extension | Expected UNSUPPORTED_MEDIA_TYPE', () => {
      return request(app.getHttpServer())
        .post('/v1/files')
        .set('Authorization', 'bearer ' + token)
        .attach('data', FILES.e2e.buffer, 'NonMP4')
        .expect(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    });

    it('/v1/files POST | Expected CREATED', () => {
      return request(app.getHttpServer())
        .post('/v1/files')
        .set('Authorization', 'bearer ' + token)
        .attach('data', FILES.e2e.buffer, FILES.e2e.filename)
        .expect(HttpStatus.CREATED);
    });

    it('/v1/files POST | With old file MD5 identically | Expected CONFLICT', () => {
      return request(app.getHttpServer())
        .post('/v1/files')
        .set('Authorization', 'bearer ' + token)
        .attach('data', FILES.e2e.buffer, FILES.e2e.filename)
        .expect(HttpStatus.CONFLICT);
    });

    it('/v1/files POST | With File larger than 15MB | Expected BAD_REQUEST', () => {
      return request(app.getHttpServer())
        .post('/v1/files')
        .set('Authorization', 'bearer ' + token)
        .attach('data', FILES._20MB.buffer, FILES._20MB.filename)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('/v1/files GET | With old file MD5 identically | Expected CONFLICT', (done) => {
      request(app.getHttpServer())
        .get('/v1/files')
        .set('Authorization', 'bearer ' + token)
        .expect(HttpStatus.OK)
        .then((response) => {
          getFiles = response.body;
          console.log('getFiles', getFiles);
          getFile = getFiles[0];
          console.log('getFile', getFile);
          done(getFiles.length === 0 ? 'Error' : null);
        });
    });

    it('/v1/files/[fileid] GET | Expected OK', (done) => {
      request(app.getHttpServer())
        .get(`/v1/files/${getFile.fileid}`)
        .set('Authorization', 'bearer ' + token)
        .expect(HttpStatus.OK)
        .then((response) => {
          const file = response.body;
          console.log('file', file);
          done(file.fileid !== getFile.fileid ? 'error' : null);
        });
    });

    it('/v1/files/[fileid] DELETE | Expected NO_CONTENT', () => {
      return request(app.getHttpServer())
        .delete(`/v1/files/${getFile.fileid}`)
        .set('Authorization', 'bearer ' + token)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('/v1/files/[fileid] GET | After deleted | Expected NOT_FOUND', () => {
      return request(app.getHttpServer())
        .get(`/v1/files/${getFile.fileid}`)
        .set('Authorization', 'bearer ' + token)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  afterAll(async () => {
    connection.close();
    console.log('db connection closed');
    await app.close();
  });
});
