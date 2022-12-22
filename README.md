# Implemented by Vorachet Jaroensawas

22 DEC 2022

Some of my work, a simple video storage server with REST APIs,in the past. This codebase intended to share with Node learner and some interview panels. 

The architecture diagram expressed by the Acradia modeling language and several components we can learn from this example.

![alt](pab.jpg)


# Running the API server

## Production 

Shell1
```
docker-compose up
```

System variables can be configured with `ROOT/.env`

## Development 

Shell1
```
docker-compose -f docker-compose-dev.yml up
```

Shell 2
```
cd api
npm run start:dev
```

System variables can be configured with `ROOT/api/.env`

# API Documentation

OpenAPI Documentation http://localhost:8080/api

OpenAPI Spec http://localhost:8080/api-json and http://localhost:8080/api-yaml

# E2E Test for a clean installation 

## Running E2E Tests using Jest
```
npm run test
```

Expected Test Results
```
bash: lli: command not found
$ cd api
$ npm run test:e2e

> video_storage_api@1.0 test:e2e
> jest --config ./apps/api/test/jest-e2e.json

  console.log
    deleted test data

      at Object.<anonymous> (app.e2e-spec.ts:74:13)

[Nest] 32946  - 08/29/2022, 9:00:36 PM   ERROR [AuthController] Invalid account
[Nest] 32946  - 08/29/2022, 9:00:36 PM   ERROR [AuthController] Invalid token
[Nest] 32946  - 08/29/2022, 9:00:36 PM   ERROR [UnsupportedContentTypeBlocker] application/octet-stream not supported. List of supported content types: video/mp4
[Nest] 32946  - 08/29/2022, 9:00:38 PM   ERROR [FileExistsBlockInterceptor] File exists. (Checked by MD5 digest)
[Nest] 32946  - 08/29/2022, 9:00:38 PM   ERROR [ExceedFileSizeLimitBlocker] Exceed media file size limit. Max 15728640 bytes'
  console.log
    getFiles [
      {
        created_at: '2022-08-29T14:00:37.640Z',
        duration: 0,
        fileid: '8b200347-1625-4fda-85dc-b0f089844ae9',
        md5: 'a6309d65340cd6375624647eeca55da3',
        mimetype: 'video/mp4',
        name: '8b200347-1625-4fda-85dc-b0f089844ae9',
        original_md5: 'a6309d65340cd6375624647eeca55da3',
        original_mimetype: 'video/mp4',
        original_size: 5485935,
        size: 5485935,
        url: 'http://localhost:9000/files/8b200347-1625-4fda-85dc-b0f089844ae9',
        userId: 'TestUserId'
      }
    ]

      at app.e2e-spec.ts:167:19
          at runMicrotasks (<anonymous>)

  console.log
    getFile {
      created_at: '2022-08-29T14:00:37.640Z',
      duration: 0,
      fileid: '8b200347-1625-4fda-85dc-b0f089844ae9',
      md5: 'a6309d65340cd6375624647eeca55da3',
      mimetype: 'video/mp4',
      name: '8b200347-1625-4fda-85dc-b0f089844ae9',
      original_md5: 'a6309d65340cd6375624647eeca55da3',
      original_mimetype: 'video/mp4',
      original_size: 5485935,
      size: 5485935,
      url: 'http://localhost:9000/files/8b200347-1625-4fda-85dc-b0f089844ae9',
      userId: 'TestUserId'
    }

      at app.e2e-spec.ts:169:19
          at runMicrotasks (<anonymous>)

  console.log
    file {
      created_at: '2022-08-29T14:00:37.640Z',
      duration: 0,
      fileid: '8b200347-1625-4fda-85dc-b0f089844ae9',
      md5: 'a6309d65340cd6375624647eeca55da3',
      mimetype: 'video/mp4',
      name: '8b200347-1625-4fda-85dc-b0f089844ae9',
      original_md5: 'a6309d65340cd6375624647eeca55da3',
      original_mimetype: 'video/mp4',
      original_size: 5485935,
      size: 5485935,
      url: 'http://localhost:9000/files/8b200347-1625-4fda-85dc-b0f089844ae9',
      userId: 'TestUserId'
    }

      at app.e2e-spec.ts:181:19
          at runMicrotasks (<anonymous>)

[Nest] 32946  - 08/29/2022, 9:00:38 PM   ERROR [FilesStorageController] File not found
  console.log
    db connection closed

      at Object.<anonymous> (app.e2e-spec.ts:203:13)
          at runMicrotasks (<anonymous>)

[Nest] 32946  - 08/29/2022, 9:00:38 PM   ERROR [DatabaseService] DB disconnected
 PASS  apps/api/test/app.e2e-spec.ts (25.558 s)
  ApiController (e2e)
    Monitoring Services
      ✓ /v1/health (24 ms)
    Auth Services
      ✓ /v1/generateToken POST | with valid mockup account | Expected CREATED (16 ms)
      ✓ /v1/generateToken POST | with invalid mockup account | Expected FORBIDDEN (5 ms)
      ✓ /v1/verifyToken/[TOKEN] GET | Valid Token | Expected OK (4 ms)
      ✓ /v1/verifyToken[TOKEN] GET | Invalid Token | Expected FORBIDDEN (3 ms)
    FilesStorage Services
      ✓ /v1/files POST | No Token | Expected FORBIDDEN (3 ms)
      ✓ /v1/files POST | Non MP4 file extension | Expected UNSUPPORTED_MEDIA_TYPE (30 ms)
      ✓ /v1/files POST | Expected CREATED (1513 ms)
      ✓ /v1/files POST | With old file MD5 identically | Expected CONFLICT (501 ms)
      ✓ /v1/files POST | With File larger than 15MB | Expected BAD_REQUEST (120 ms)
      ✓ /v1/files GET | With old file MD5 identically | Expected CONFLICT (50 ms)
      ✓ /v1/files/[fileid] GET | Expected OK (45 ms)
      ✓ /v1/files/[fileid] DELETE | Expected NO_CONTENT (153 ms)
      ✓ /v1/files/[fileid] GET | After deleted | Expected NOT_FOUND (56 ms)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        25.648 s
```


## Running E2E Tests using Newman
```
npm run test:newman
```

```
> video_storage_api@1.0 test:newman
> newman run ../test.postman_collection.json

newman

Video Storage Server Autotest

❏ Test
↳ Healthcheck
  GET http://localhost:8080/v1/health [200 OK, 666B, 57ms]
  ✓  healthcheck

┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │                3 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │                2 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │                1 │                0 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: 111ms                                     │
├───────────────────────────────────────────────────────────────┤
│ total data received: 2B (approx)                              │
├───────────────────────────────────────────────────────────────┤
│ average response time: 57ms [min: 57ms, max: 57ms, s.d.: 0µs] │
└───────────────────────────────────────────────────────────────┘
SatieMBP:api vorachet$ 
```

Some E2E tests will check dupicate file, so selectively remove the data on database may be required. 

# The subsystems provided by Docker container

## File Storage (MinIO)
Store video files

http://localhost:9001 

```
user: admin
pasword: adminadmin
```

## Database (MongoDB)
Store video file metadata 

```
mongodb://admin:adminadmin@localhost
```

## In-memory Data Store (Redis)
Provide a queue system for MP4-WEBM conversion process

```
redis-cli -a adminadmin -p 6379
```

# Overview

## The summary of implementation

- `Implemented ->` **CRUD implemention** as described in the ROOT/api.yaml.

- `Implemented ->` **Dockerfile** and **docker-compose** to build and run the server and other required services as docker containers.

- The endpoints of the server are exposed to the host machine.

- `Implemented ->` Video searching by name, duration and so on

- `Implemented ->` Authentication and multi-user support

- `Implemented ->` Asynchronous video convert to webm (using ffmpeg etc.)

- `Partially implemented ->` Create an API that shows the progress of the converting task.

- `Partially implemented ->` Use same API to download converted data

- `Not yet implemented ->` Data encryption and key management


# Architecture

![Alt text](pab.jpg?raw=true "Architecture")


## Test videos

```
ROOT/api/testData
.
├── 10MB.mp4
├── 1MB.mp4
├── 20MB.mp4
├── 2MB.mp4
├── 5MB.mp4
```