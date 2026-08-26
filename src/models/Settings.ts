import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  companyNameAr: string;
  defaultCurrency: 'USD' | 'SYP';
  displayCurrencies: Array<'USD' | 'SYP'>;
  timezone: string;
  updatedAt: Date;
  createdAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: 'Elyptek' },
    companyNameAr: { type: String, default: 'إليبتك' },
    defaultCurrency: { type: String, enum: ['USD', 'SYP'], default: 'USD' },
    displayCurrencies: { type: [String], default: ['USD', 'SYP'] },
    timezone: { type: String, default: 'Asia/Damascus' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
