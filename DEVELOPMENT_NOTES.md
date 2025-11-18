# Development Notes

## Running the Application

**Important:** When working with this application, please run the development server separately using:

```bash
npm run dev
```

Do not rely on automated tools to start the development server, as this allows for better control and monitoring of the application during development.

## Database Validation

The application now validates user database access on authentication. If a user's database does not exist or is not accessible, they will be redirected to the sign-in page with an appropriate error message.