# Development Notes

## Key Principles

- **Database Abstraction**: All database interactions should be abstracted through a factory pattern. This allows for easy switching between different database providers and configurations.
- **User-Specific Databases**: Each user has their own database to ensure data isolation and security.
- **Configuration Management**: All configuration should be managed through the `lib/config.js` file. This includes database connection strings, API keys, and other sensitive information.
- **Session Management**: All session management should be handled by `next-auth`.

## Database Factory

The `databaseFactory.js` file is responsible for creating and managing database connections. It uses a singleton pattern to ensure that only one `MongoClient` instance is created per user.

## Session Management

The `pages/api/auth/[...nextauth].js` file is responsible for handling all authentication and session management. It uses the `next-auth` library to provide a secure and robust authentication system.

## API Routes

All API routes should be placed in the `pages/api` directory. Each route should handle a specific resource and provide a clear and consistent interface.

## Error Handling

All API routes should include robust error handling to ensure that the application is resilient and secure.

## Implemented

- **Database Factory**: Implemented a database factory to manage database connections.
- **User-Specific Databases**: Implemented user-specific databases to ensure data isolation.
- **Configuration Management**: Implemented a configuration management system to manage all configuration.
- **Session Management**: Implemented a session management system using `next-auth`.
- **API Routes**: Implemented API routes for subscriptions and user data.
- **Error Handling**: Implemented error handling in all API routes.
- **Fixed `CLIENT_FETCH_ERROR`**: Fixed a `CLIENT_FETCH_ERROR` that was causing users to be logged out when adding a subscription.
- **Fixed database connection issue**: Fixed a database connection issue that was causing a new `MongoClient` instance to be created for each API request.
- **Fixed `unstable_getServerSession` issue**: Fixed an issue where `unstable_getServerSession` was not being used correctly.
- **Fixed `getUserDb` issue**: Fixed an issue where `getUserDb` was being used instead of `getUserDatabase`.
- **Removed `lib/mongodb.js`**: Removed the `lib/mongodb.js` file, as it is no longer needed.
- **Updated `pages/api/user/index.js`**: Updated the `pages/api/user/index.js` file to use `getUserDatabase` instead of `getUserDb`.
- **Updated `DEVELOPMENT_NOTES.md`**: Updated the `DEVELOPMENT_NOTES.md` file to reflect the work that has been done.
