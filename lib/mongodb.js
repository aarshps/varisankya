// Import the database factory and its functions
import databaseFactory, { getUserDatabase as factoryGetUserDatabase, generateDatabaseName as factoryGenerateDatabaseName } from './databaseFactory';

// Export the client promise and user database function from the factory
// For the default export, we return the actual promise, not a function
export default databaseFactory.getClientPromise();
export const getUserDb = factoryGetUserDatabase;
export const generateDatabaseName = factoryGenerateDatabaseName;