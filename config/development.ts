// Development environment configuration
export const developmentConfig = {
  // Database
  database: {
    logQueries: true,
    connectionPoolSize: 5,
  },
  
  // Security
  security: {
    // Relaxed security for development
    corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    rateLimitEnabled: false,
    requireHttps: false,
  },
  
  // Email
  email: {
    // Use console logging instead of sending real emails
    mockSending: true,
    logLevel: 'debug',
  },
  
  // Features
  features: {
    // Enable all features in development
    debugMode: true,
    verboseLogging: true,
    showStackTraces: true,
  },
  
  // Caching
  cache: {
    // Shorter cache times for development
    defaultTTL: 60, // 1 minute
    enabled: false,
  },
  
  // External services
  services: {
    // Mock external services in development
    mockUniversityAPI: true,
    mockPaymentProvider: true,
  },
};