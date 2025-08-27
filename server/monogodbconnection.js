const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const newclient = new MongoClient(uri);

async function connectDB() {
  try {
    await newclient.connect();
    console.log("✅ MongoDB connected ");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = { newclient, connectDB };
