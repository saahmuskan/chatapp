const mongoose = require("mongoose");
 
// Connect to MongoDB using the URI from .env
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // Stop the app if DB connection fails
  }
};
 
module.exports = connectDB;