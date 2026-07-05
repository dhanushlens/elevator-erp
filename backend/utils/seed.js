import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Company from '../models/Company.js';
import Elevator from '../models/Elevator.js';
import Technician from '../models/Technician.js';
import Service from '../models/Service.js';
import Invoice from '../models/Invoice.js';
import Settings from '../models/Settings.js';

const seed = async () => {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  await Settings.getSingleton();

  if ((await Company.countDocuments()) === 0) {
    const company = await Company.create({
      name: 'Skyline Towers Pvt Ltd',
      phone: '+91 98765 43210',
      email: 'facilities@skylinetowers.example',
      address: '12 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      gst: '29ABCDE1234F1Z5',
      buildings: [{ name: 'Tower A', address: '12 MG Road', floors: 18 }],
      createdBy: admin._id,
    });
    const customer = await Customer.create({
      name: 'Rajesh Kumar',
      company: company._id,
      phone: '+91 91234 56789',
      email: 'rajesh@skylinetowers.example',
      address: '12 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      createdBy: admin._id,
    });
    const technician = await Technician.create({
      name: 'Suresh Patil',
      mobile: '+91 99887 76655',
      email: 'suresh@example.com',
      joiningDate: new Date('2023-04-01'),
      monthlySalary: 28000,
      performanceRating: 4.5,
      createdBy: admin._id,
    });
    const elevator = await Elevator.create({
      customer: customer._id,
      company: company._id,
      building: 'Tower A',
      address: '12 MG Road, Bengaluru',
      elevatorType: 'passenger',
      capacity: '8 persons / 544 kg',
      floors: 18,
      installationDate: new Date('2022-06-15'),
      warrantyExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      amcExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      nextService: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignedTechnician: technician._id,
      createdBy: admin._id,
    });
    const service = await Service.create({
      customer: customer._id,
      company: company._id,
      elevator: elevator._id,
      complaint: 'Door sensor intermittently failing',
      serviceType: 'repair',
      visitDate: new Date(),
      visitTime: '10:30',
      technician: technician._id,
      workDone: 'Replaced door sensor and calibrated door operator',
      partsUsed: [{ name: 'Door sensor', quantity: 1, cost: 2500 }],
      status: 'completed',
      durationMinutes: 90,
      cost: 4500,
      nextVisit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });
    await Invoice.create({
      customer: customer._id,
      company: company._id,
      service: service._id,
      items: [
        { description: 'Door sensor replacement', quantity: 1, rate: 2500 },
        { description: 'Service charges', quantity: 1, rate: 2000 },
      ],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });
    console.log('Seeded sample company, customer, technician, elevator, service and invoice');
  } else {
    console.log('Sample data already present, skipping');
  }

  await mongoose.disconnect();
  console.log('Seed complete');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
