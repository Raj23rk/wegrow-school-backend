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
    return true;
  } catch (err: any) {
    console.warn(`[MongoDB] Connection warning (${err.message}). Using hybrid fallback store if needed.`);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
