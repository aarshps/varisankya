// config.js - Centralized configuration object for environment variables

class AppConfig {
  constructor() {
    // Database configuration
    this.MONGODB_URI = process.env.MONGODB_URI;
    this.CLIENT_ID = process.env.CLIENT_ID;
    this.CLIENT_SECRET = process.env.CLIENT_SECRET;
    this.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
    this.NEXTAUTH_URL = process.env.NEXTAUTH_URL;

    // Environment
    this.NODE_ENV = process.env.NODE_ENV || 'development';

    // Validation
    this.validateConfig();
  }

  validateConfig() {
    const required = ['MONGODB_URI', 'CLIENT_ID', 'CLIENT_SECRET', 'NEXTAUTH_SECRET'];
    const missing = required.filter(key => !this[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Helper method to get database name based on username and environment
  getDatabaseName(username) {
    // Remove dots from username as they are not allowed in MongoDB database names
    const sanitizedUsername = username.replace(/\./g, '');
    return `vari_${sanitizedUsername}_${this.NODE_ENV}`;
  }

  // Helper method to check if running in development
  isDevelopment() {
    return this.NODE_ENV === 'development';
  }

  // Helper method to check if running in production
  isProduction() {
    return this.NODE_ENV === 'production';
  }
}

// Create and export a singleton instance
const config = new AppConfig();
export default config;