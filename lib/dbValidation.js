import { getUserDb } from './mongodb';

// Function to validate database access for a user
export async function validateUserDatabase(username) {
  try {
    const db = await getUserDb(username);

    // Test database access by attempting a simple operation
    // This will throw an error if the database is not accessible
    await db.admin().ping(); // Try to ping the database

    // Attempt to find a document from a collection to ensure the database is accessible
    await db.collection('subscriptions').findOne({});

    return true; // Database is accessible
  } catch (error) {
    console.error(`Database validation failed for user ${username}:`, error);

    // Check if the error is related to database not existing or being inaccessible
    // MongoDB errors often contain specific error codes
    if (error.code === 13 || // Unauthorized
        error.code === 18 || // AuthenticationFailed
        error.message.includes('does not exist') ||
        error.message.includes('not found') ||
        error.message.includes('not authorized')) {
      return false; // Database is not accessible
    }

    // For other errors, we'll still return false to be safe
    return false; // Database is not accessible
  }
}