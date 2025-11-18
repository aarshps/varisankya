// Import the database factory for validation
import databaseFactory from './databaseFactory';

// Function to validate database access for a user using the factory
export async function validateUserDatabase(username) {
  return await databaseFactory.validateUserDatabase(username);
}