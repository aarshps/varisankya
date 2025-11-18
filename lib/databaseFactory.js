import { MongoClient } from 'mongodb';
import config from './config';

// Database factory class to handle all database-related operations
class DatabaseFactory {
  constructor(userOptions = {}) {
    this.config = config;
    this.options = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      ...userOptions // Allow user to override default options
    };

    if (!this.config.MONGODB_URI) {
      throw new Error('Please add your MongoDB URI to .env.local');
    }

    // Initialize the client promise immediately in constructor
    this.clientPromise = this.initializeClient();
  }

  // Initialize the MongoDB client
  initializeClient(userDbConfig = null) {
    // Merge default options with user-specific database configuration
    const clientOptions = { ...this.options, ...(userDbConfig || {}) };

    if (this.config.isDevelopment()) {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      if (!global._mongoClientPromise) {
        const client = new MongoClient(this.config.MONGODB_URI, clientOptions);
        global._mongoClientPromise = client.connect();
      }
      return global._mongoClientPromise;
    } else {
      // In production mode, it's best to use a global variable.
      if (!global._mongoClientPromise) {
        const client = new MongoClient(this.config.MONGODB_URI, clientOptions);
        global._mongoClientPromise = client.connect();
      }
      return global._mongoClientPromise;
    }
  }

  // Getter for the client promise
  getClientPromise() {
    return this.clientPromise;
  }

  // Generate database name based on username and environment
  generateDatabaseName(username) {
    const dbName = this.config.getDatabaseName(username);
    console.log(`[DatabaseFactory] Generated database name: ${dbName} for username: ${username}`);
    return dbName;
  }

  // Get a user-specific database instance
  async getUserDatabase(username) {
    const client = await this.getClientPromise();
    const dbName = this.generateDatabaseName(username);

    try {
      console.log(`[DatabaseFactory] Accessing database: ${dbName} for user: ${username}`);
      const db = client.db(dbName);

      // Verify the database name is what we expect
      console.log(`[DatabaseFactory] Created DB instance for: ${db.databaseName}, expected: ${dbName}`);

      // Validate that the actual database name matches what we expect
      if (db.databaseName !== dbName) {
        console.error(`[DatabaseFactory] Database name mismatch. Expected: ${dbName}, Got: ${db.databaseName}`);
        throw new Error(`Database name mismatch for user ${username}`);
      }

      // Test if the database is accessible by attempting to run a command
      // This helps verify that the database exists and is accessible
      console.log(`[DatabaseFactory] Testing database access for: ${dbName}`);
      await db.command({ ping: 1 });

      // Ensure the database exists by performing a read operation
      // MongoDB will make the database "real" when we perform first operation
      console.log(`[DatabaseFactory] Successfully accessed database: ${dbName}`);

      return db;
    } catch (error) {
      console.error(`[DatabaseFactory] Error accessing database for user ${username} (db: ${dbName}):`, error);
      throw new Error(`Database access error for user ${username}`);
    }
  }

  // Validate if a user's database exists and is accessible
  async validateUserDatabase(username) {
    try {
      console.log(`[DatabaseFactory] Validating database access for user: ${username}`);
      const dbName = this.generateDatabaseName(username);
      console.log(`[DatabaseFactory] Validation will use database: ${dbName}`);

      // Avoid creating / accessing the user's database during validation by using the admin DB
      const client = await this.getClientPromise();
      const adminDb = client.db().admin();
      const dbs = await adminDb.listDatabases();

      const exists = dbs.databases && dbs.databases.some(d => d.name === dbName);
      if (!exists) {
        console.log(`[DatabaseFactory] Database ${dbName} does not exist for user: ${username}`);
        return false;
      }

      // If the database exists, ensure it has a 'users' collection to indicate it was fully created
      const db = client.db(dbName);
      const collections = await db.listCollections({ name: 'users' }).toArray();
      if (!collections || collections.length === 0) {
        console.log(`[DatabaseFactory] Database ${dbName} exists but has no 'users' collection for user: ${username}`);
        return false;
      }

      console.log(`[DatabaseFactory] Database validation successful for: ${username} (${dbName})`);
      return true; // Database is accessible and has the necessary collections
    } catch (error) {
      console.error(`[DatabaseFactory] Database validation failed for user ${username}:`, error);

      // Check if the error is related to database not existing or being inaccessible
      // MongoDB errors often contain specific error codes
      if (error.code === 13 || // Unauthorized
          error.code === 18 || // AuthenticationFailed
          error.code === 8000 || // Network error
          error.message.includes('does not exist') ||
          error.message.includes('not found') ||
          error.message.includes('not authorized') ||
          error.message.includes('Authentication failed') ||
          error.message.includes('network error') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ECONNRESET')) {
        console.log(`[DatabaseFactory] Database validation determined database is not accessible for user: ${username}`);
        return false; // Database is not accessible
      }

      // For other errors, we'll still return false to be safe
      console.log(`[DatabaseFactory] Database validation failed with other error for user: ${username}`);
      return false; // Database is not accessible
    }
  }
}

// Create a singleton instance of the DatabaseFactory
const databaseFactory = new DatabaseFactory();

// Export the singleton instance and utility functions
export default databaseFactory;
export const getUserDatabase = databaseFactory.getUserDatabase.bind(databaseFactory);
export const validateUserDatabase = databaseFactory.validateUserDatabase.bind(databaseFactory);
export const generateDatabaseName = databaseFactory.generateDatabaseName.bind(databaseFactory);
export const getClientPromise = databaseFactory.getClientPromise.bind(databaseFactory);

// Function to create a new instance with user-specific configuration
export function createUserDatabaseFactory(userOptions = {}) {
  return new DatabaseFactory(userOptions);
}