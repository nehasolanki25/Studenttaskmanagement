const mongoose = require("mongoose");

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    try {
      const User = require("../models/User");

      await User.syncIndexes();

      console.log("User indexes synchronized successfully");
    } catch (indexError) {
      console.error(
        "User index synchronization failed:",
        indexError.message
      );
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;