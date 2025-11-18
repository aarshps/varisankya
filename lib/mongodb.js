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
    // Test the connection by attempting to access the database
    const db = client.db(dbName);

    // Verify that the database exists or can be created
    // MongoDB creates databases on first write operation
    // but we can verify by listing databases
    const adminDb = client.db().admin();
    const databaseList = await adminDb.listDatabases();
    const dbExists = databaseList.databases.some(db => db.name === dbName);

    // If the database doesn't exist, we'll allow it to be created on first use
    return db;
  } catch (error) {
    console.error(`Error accessing database for user ${username}:`, error);
    throw new Error(`Database access error for user ${username}`);
  }
}