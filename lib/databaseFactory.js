import { MongoClient } from 'mongodb';
import config from './config';

// Cache for validation results (in-memory cache with TTL)
const validationCache = new Map();
const CACHE_TTL = 60000; // 60 seconds

// Database factory class with caching
class DatabaseFactory {
  constructor(userOptions = {}) {
    this.config = config;
    this.options = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      maxPoolSize: 10, // Connection pooling
      minPoolSize: 2,
      ...userOptions
    };

    if (!this.config.MONGODB_URI) {
      throw new Error('Please add your MongoDB URI to .env.local');
    }

    this.clientPromise = this.initializeClient();
  }

  // Initialize MongoDB client with connection pooling
  initializeClient(userDbConfig = null) {
    const clientOptions = { ...this.options, ...(userDbConfig || {}) };

    if (!global._mongoClientPromise) {
      const client = new MongoClient(this.config.MONGODB_URI, clientOptions);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  getClientPromise() {
    return this.clientPromise;
  }

  // Generate database name (no logging)
  generateDatabaseName(username) {
    return this.config.getDatabaseName(username);
  }

  // Get user database with minimal logging
  async getUserDatabase(username) {
    const client = await this.getClientPromise();
    const dbName = this.generateDatabaseName(username);

    try {
      const db = client.db(dbName);

      if (db.databaseName !== dbName) {
        throw new Error(`Database name mismatch for user ${username}`);
      }

      // Quick ping test
      await db.command({ ping: 1 });
      return db;
    } catch (error) {
      console.error(`[DB Error] ${username}:`, error.message);
      throw new Error(`Database access error for user ${username}`);
    }
  }

  // Cached validation with TTL (no logging)
  async validateUserDatabase(username) {
    const cacheKey = `validation_${username}`;
    const cached = validationCache.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.isValid;
    }

    try {
      const dbName = this.generateDatabaseName(username);
      const client = await this.getClientPromise();

      // Quick validation - check if DB exists
      const adminDb = client.db().admin();
      const dbs = await adminDb.listDatabases();
      const exists = dbs.databases?.some(d => d.name === dbName);

      if (!exists) {
        validationCache.set(cacheKey, { isValid: false, timestamp: Date.now() });
        return false;
      }

      // Cache successful validation
      validationCache.set(cacheKey, { isValid: true, timestamp: Date.now() });
      return true;
    } catch (error) {
      // Cache failed validation
      validationCache.set(cacheKey, { isValid: false, timestamp: Date.now() });
      return false;
    }
  }
}

// Singleton instance
const databaseFactory = new DatabaseFactory();

export default databaseFactory;
export const getUserDatabase = databaseFactory.getUserDatabase.bind(databaseFactory);
export const validateUserDatabase = databaseFactory.validateUserDatabase.bind(databaseFactory);
export const generateDatabaseName = databaseFactory.generateDatabaseName.bind(databaseFactory);
export const getClientPromise = databaseFactory.getClientPromise.bind(databaseFactory);

export function createUserDatabaseFactory(userOptions = {}) {
  return new DatabaseFactory(userOptions);
}