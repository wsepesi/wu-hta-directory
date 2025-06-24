// Staging environment configuration
export const stagingConfig = {
  // Database
  database: {
    logQueries: false,
    connectionPoolSize: 10,
  },
  
  // Security
  security: {
    // Staging should mirror production security
    corsOrigins: ['https://staging.wu-head-tas.vercel.app'],
    rateLimitEnabled: true,
    requireHttps: true,
  },
  
  // Email
  email: {
    // Send real emails but to test addresses
    mockSending: false,
    testEmailDomain: '@staging.wu-head-tas.com',
    logLevel: 'info',
  },
  
  // Features
  features: {
    // Enable most features but with safety guards
    debugMode: true,
    verboseLogging: true,
    showStackTraces: true,
  },
  
  // Caching
  cache: {
    // Moderate cache times for staging
    defaultTTL: 300, // 5 minutes
    enabled: true,
  },
  
  // External services
  services: {
    // Use sandbox/test endpoints for external services
    mockUniversityAPI: false,
    mockPaymentProvider: false,
    useSandboxEndpoints: true,
  },
};