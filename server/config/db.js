import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabaseIfEmpty } from '../seed/seedData.js';

let mongod = null;

export async function connectDB() {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      console.log('No MONGODB_URI provided. Initializing in-memory MongoDB server...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`In-memory MongoDB ready at ${uri}`);
    }

    await mongoose.connect(uri);
    console.log(`Connected to MongoDB database (${mongoose.connection.host})`);

    // Seed data on connect
    await seedDatabaseIfEmpty();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    // If external URI failed, fallback to memory server
    if (!mongod) {
      console.log('Falling back to MongoMemoryServer...');
      try {
        mongod = await MongoMemoryServer.create();
        const fallbackUri = mongod.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`Connected to fallback MongoDB at ${fallbackUri}`);
        await seedDatabaseIfEmpty();
      } catch (innerErr) {
        console.error('Could not start MongoDB fallback:', innerErr);
      }
    }
  }
}

export async function closeDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

export const disconnectDB = closeDB;
