/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import mongoose from 'mongoose';

const DATABASE_URL =
  process.env.DATABASE_URL || `mongodb://admin:adminadmin@localhost`;
const MONGO_CONNECTION_TIMEOUT_MS = 5000;
const MONGO_MIN_POOL_SIZE = 10;
const MONGO_MAX_POOL_SIZE = 100;

@Injectable()
export class DatabaseService
  implements OnModuleInit, OnApplicationShutdown, BeforeApplicationShutdown
{
  private logger = new Logger(DatabaseService.name);
  private connected = false;
  private connection: mongoose.Connection;

  async onModuleInit() {
    if (!this.connected) {
      await this.setupConnection();
    }
  }

  beforeApplicationShutdown() {
    this.connection.close();
  }

  onApplicationShutdown() {
    this.logger.verbose('onApplicationShutdown');
  }

  createObjectId(objectIdString?: string): mongoose.Types.ObjectId {
    if (objectIdString) {
      return new mongoose.Types.ObjectId(objectIdString);
    } else {
      return new mongoose.Types.ObjectId();
    }
  }

  async setupConnection() {
    return new Promise(async (resolve, reject) => {
      if (this.connected) return;

      this.connection = mongoose.connection;

      this.connection.on('connecting', () => {
        this.logger.verbose(`DB connecting`);
      });

      this.connection.on('error', (error) => {
        this.logger.error(`DB error: ${error}`);
        mongoose.disconnect();
        reject(error);
      });

      this.connection.on('connected', async () => {
        this.logger.verbose('DB connected');
        this.connected = true;
        resolve(true);
      });

      this.connection.once('open', () => {
        this.logger.verbose('DB opened');
      });

      this.connection.on('disconnected', () => {
        this.logger.error('DB disconnected');
        this.connected = false;
      });

      this.connection.on('reconnected', () => {
        this.logger.verbose('DB reconnected!');
      });

      mongoose.connect(DATABASE_URL, {
        serverSelectionTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
        keepAlive: true,
        minPoolSize: MONGO_MIN_POOL_SIZE,
        maxPoolSize: MONGO_MAX_POOL_SIZE,
      });
    });
  }

  isConnected() {
    return this.connected;
  }

  async serverStatus() {
    if (!this.connected) {
      await this.setupConnection();
      return await this.connection.db.admin().serverStatus();
    }
    return await this.connection.db.admin().serverStatus();
  }

  getCollection(dbName: string, collectionNnme: string): mongoose.Collection {
    if (!this.connected) {
      this.setupConnection()
        .then(() => {
          return this.connection.useDb(dbName).collection(collectionNnme);
        })
        .catch(() => {
          throw new Error('No connection');
        });
    }
    return this.connection.useDb(dbName).collection(collectionNnme);
  }

  getFilesCollection(): mongoose.Collection {
    if (!this.connected) {
      this.setupConnection()
        .then(() => {
          return this.connection
            .useDb(process.env.DATABASE_NAME)
            .collection('files');
        })
        .catch(() => {
          throw new Error('No connection');
        });
    }
    return this.connection.useDb(process.env.DATABASE_NAME).collection('files');
  }
}
