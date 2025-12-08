import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.DB_URI;

  if (!uri) {
    throw new Error("DB_URI is not defined in environment");
  }

  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      dbName: "stitchLogic",
      autoIndex: false,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
