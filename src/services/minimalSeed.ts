import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';

export async function runMinimalSeed() {
  await Settings.findOneAndUpdate(
    {},
    {
      companyName: 'Elyptek',
      companyNameAr: 'Elyptek',
      defaultCurrency: 'USD',
      displayCurrencies: ['USD', 'SYP'],
      timezone: 'Asia/Damascus',
    },
    { upsert: true, new: true }
  );

  const adminPassword = await bcrypt.hash('change-me', 10);
  await User.findOneAndUpdate(
    { email: 'admin@example.com' },
    {
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  return {
    email: 'admin@example.com',
    password: 'change-me',
  };
}
