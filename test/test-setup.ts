import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const setupTestDB = async (): Promise<string> => {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
};

export const teardownTestDB = async (): Promise<void> => {
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const getTestJwtSecret = (): string => {
  return 'test-jwt-secret-key';
};
