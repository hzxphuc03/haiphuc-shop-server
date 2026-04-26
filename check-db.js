import mongoose from 'mongoose';
import Order from './server/src/models/Order.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to DB');
    
    const allOrders = await Order.find({}).limit(5);
    console.log('Total orders in DB:', await Order.countDocuments({}));
    console.log('Sample orders:', allOrders.map(o => ({
      id: o._id,
      userId: o.userId,
      user: o.user,
      fullName: o.fullName
    })));

    const adminOrders = await Order.find({ user: 'admin_haiphuc' });
    console.log('Orders with user "admin_haiphuc":', adminOrders.length);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
