const mongoose = require('mongoose');

async function testConnection() {
  try {
    const uri = 'mongodb+srv://hackboatswebteam_db_user:HjoP7wUVPLEoFbFi@cluster0.agmwwmk.mongodb.net/';
    console.log("Testing connection to:", uri.replace(/:([^:@]{3,})@/, ':***@')); 
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
}

testConnection();
