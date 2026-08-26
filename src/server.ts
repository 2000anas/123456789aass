import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    console.log(`Timezone: ${env.timezone}`);
    if (env.isProd) {
      console.log(`Serving web UI from ${env.webDist}`);
    }
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
