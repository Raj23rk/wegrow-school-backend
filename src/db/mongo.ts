import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

let isConnected = false;

export async function connectMongo(): Promise<boolean> {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.name}`);

    // Ensure legacy unique index on student email is removed to allow siblings / shared parent emails
    try {
      const studentColl = conn.connection.collection('students');
      const indexes = await studentColl.indexes();
      const legacyEmailIdx = indexes.find((idx) => idx.name === 'email_1');
      if (legacyEmailIdx && legacyEmailIdx.unique) {
        await studentColl.dropIndex('email_1');
        console.log('[MongoDB] Legacy unique index email_1 removed to support shared parent email');
      }
    } catch (e: any) {
      // index already dropped or collection not yet initialized
    }

    return true;
  } catch (err: any) {
    console.warn(`[MongoDB] Connection warning (${err.message}). Using hybrid fallback store if needed.`);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
