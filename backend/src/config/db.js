const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`, { service: 'database' });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { service: 'database', meta: { error: err.message } });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...', { service: 'database' });
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      service: 'database',
      meta: { error: error.message, uri: env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') },
    });
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
