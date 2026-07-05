import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Elevator Service Co.' },
    companyLogo: { type: String },
    companyAddress: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    companyGst: { type: String },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '\u20B9' },
    taxPercent: { type: Number, default: 18 },
    amcReminderDays: { type: Number, default: 30 },
    warrantyReminderDays: { type: Number, default: 30 },
    serviceReminderDays: { type: Number, default: 3 },
    invoicePrefix: { type: String, default: 'INV' },
    invoiceFooter: { type: String, default: 'Thank you for your business!' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.model('Settings', settingsSchema);
