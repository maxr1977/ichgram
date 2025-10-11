import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    if (env.isDev) {
      console.log('MongoDB connected');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDatabase;
