const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
// This module exports a function to connect to MongoDB using Mongoose.
// It uses an async function to handle the connection and logs success or error messages.
// Make sure to set the MONGO_URI environment variable before running the application.
// You can use this function in your main application file to establish the database connection.

/*
const mongoose = require('mongoose');

/**
 * Attempts to connect to MongoDB using a primary URI. If that fails (for
 * example due to SRV DNS lookup errors), attempts fallback URIs in order:
 *  - process.env.MONGO_URI_FALLBACK
 *  - mongodb://localhost:27017/supreme_dev
 *
 * This is intentionally forgiving for local development so seed scripts can
 * run when Atlas SRV DNS lookups are blocked.
 /*
const connectDB = async () => {
  const tried = [];

  const primary = process.env.MONGO_URI;
  const fallback = process.env.MONGO_URI_FALLBACK || 'mongodb://localhost:27017/supreme_dev';

  const tryConnect = async (uri) => {
    tried.push(uri);
    try {
      await mongoose.connect(uri, { dbName: uri.includes('localhost') ? undefined : undefined });
      console.log('MongoDB connected to', uri.startsWith('mongodb+srv') ? '(SRV) ' + uri : uri);
      return true;
    } catch (err) {
      console.error(`Mongo connect failed for ${uri}:`, err.message || err);
      return false;
    }
  };

  if (primary) {
    const ok = await tryConnect(primary);
    if (ok) return;
    // If primary fails, continue to fallback
    console.warn('Primary MongoDB connection failed. Trying fallback(s)...');
  }

  if (process.env.MONGO_URI_FALLBACK) {
    const ok = await tryConnect(process.env.MONGO_URI_FALLBACK);
    if (ok) return;
  }

  // Try local dev Mongo as last resort
  const okLocal = await tryConnect(fallback);
  if (okLocal) return;

  console.error('All MongoDB connection attempts failed. Tried:', tried.join(', '));
  // Do not process.exit so that scripts can decide how to proceed (e.g., run in offline mode)
};
*/
module.exports = connectDB;
// This module exports a function to connect to MongoDB using Mongoose.
// It uses an async function to handle the connection and logs success or error messages.
// Make sure to set the MONGO_URI environment variable before running the application.
// You can use this function in your main application file to establish the database connection.