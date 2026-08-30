import type { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import { connectDatabase } from '../../src/config/db.js';
import app from '../../src/app.js';

let handlerInstance: ReturnType<typeof serverless> | null = null;

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDatabase();

  if (!handlerInstance) {
    handlerInstance = serverless(app);
  }

  return handlerInstance(event, context);
};
