import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { runMinimalSeed } from '../services/minimalSeed.js';

async function seedMin() {
  await connectDatabase();
  const credentials = await runMinimalSeed();

  console.log('\n✅ Minimal seed completed\n');
  console.log('Admin login:');
  console.log(`  Email:    ${credentials.email}`);
  console.log(`  Password: ${credentials.password}`);
  console.log('\nChange this password after first login in production.\n');

  await mongoose.disconnect();
}

seedMin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
