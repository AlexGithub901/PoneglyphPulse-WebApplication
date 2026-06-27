// db.js
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
