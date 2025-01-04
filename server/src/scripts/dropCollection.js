import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.collection('users').drop();
    console.log('Users collection dropped successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

dropCollection();
