import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabaseIfEmpty } from '../seed/seedData.js';

let mongod = null;
let isConnected = false;

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 2000;

export async function connectDB(retries = MAX_RETRIES) {
  const isProduction = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGODB_URI;

  if (isProduction && !uri) {
    const errorMsg = 'FATAL CONFIGURATION ERROR: MONGODB_URI is required in production environment. Refusing to run without persistent database.';
    console.error(`\x1b[31m[Database Fatal]\x1b[0m ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // In development / test mode without MONGODB_URI, spin up MongoMemoryServer
  if (!uri) {
    if (!mongod) {
      console.log('\x1b[33m[Database Dev]\x1b[0m No MONGODB_URI provided. Initializing in-memory MongoDB server for testing/development...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`\x1b[32m[Database Dev]\x1b[0m In-memory MongoDB ready at ${uri}`);
    } else {
      uri = mongod.getUri();
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      });

      isConnected = true;
      console.log(`\x1b[32m[Database]\x1b[0m Connected to MongoDB (${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name})`);

      // Seed development data only if non-production or explicitly permitted
      if (!isProduction || process.env.ALLOW_PROD_SEED === 'true') {
        await seedDatabaseIfEmpty();
      }

      return mongoose.connection;
    } catch (error) {
      console.error(`\x1b[31m[Database Error]\x1b[0m Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
      } else {
        if (isProduction) {
          throw new Error(`Production MongoDB connection failed after ${retries} attempts: ${error.message}`);
        }
        // In dev fallback to memory server if external uri failed
        if (!mongod) {
          console.log('\x1b[33m[Database Dev Fallback]\x1b[0m External MongoDB unreachable, starting fallback MongoMemoryServer...');
          mongod = await MongoMemoryServer.create();
          const fallbackUri = mongod.getUri();
          await mongoose.connect(fallbackUri);
          console.log(`\x1b[32m[Database Dev]\x1b[0m Connected to fallback MongoDB at ${fallbackUri}`);
          await seedDatabaseIfEmpty();
          return mongoose.connection;
        }
        throw error;
      }
    }
  }
}

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
  isConnected = false;
  console.log('[Database] Disconnected MongoDB gracefully.');
}

export const disconnectDB = closeDB;

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});
