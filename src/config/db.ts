import mongoose from "mongoose";

export const connectDB = async () => {
    try {
      const mongoURI = process.env.MONGO_URI;
      if (!mongoURI) {
        console.error('FATAL ERROR: MONGO_URI is not defined.');
        process.exit(1);
      }
      await mongoose.connect(mongoURI);
      console.log('MongoDB Connected...');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  };