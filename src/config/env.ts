import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(rootDir, '.env') });

export const env = {
  port: Number(process.env.PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elyptek-manage',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  timezone: process.env.APP_TIMEZONE || 'Asia/Damascus',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isNetlify: process.env.NETLIFY === 'true',
  rootDir,
  webDist: path.join(rootDir, 'dist/web'),
};

export const CURRENCIES = ['USD', 'SYP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const WEEK_DAYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];
