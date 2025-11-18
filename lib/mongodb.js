import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to use a global variable.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
}

// Export the client and a function to get user-specific databases
export default clientPromise;

export async function getUserDb(username) {
  const client = await clientPromise;
  const environment = process.env.NODE_ENV || 'development';
  const dbName = `vari_${username}_${environment}`;

  try {
    // Explicitly specify the database name when getting the database instance
    const db = client.db(dbName);

    // Test if the database is accessible by attempting to list collections
    // This helps verify that the database exists and is accessible
    await db.listCollections().toArray();

    return db;
  } catch (error) {
    console.error(`Error accessing database for user ${username} (db: ${dbName}):`, error);
    throw new Error(`Database access error for user ${username}`);
  }
}