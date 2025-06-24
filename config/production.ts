// Production environment configuration
export const productionConfig = {
  // Database
  database: {
    logQueries: false,
    connectionPoolSize: 20,
  },
  
  // Security
  security: {
    // Strict security for production
    corsOrigins: ['https://wu-head-tas.vercel.app'],
    rateLimitEnabled: true,
    requireHttps: true,
    strictTransportSecurity: true,
    contentSecurityPolicy: true,
  },
  
  // Email
  email: {
    // Send real emails in production
    mockSending: false,
    logLevel: 'error',
    batchSize: 100,
    retryAttempts: 3,
  },
  
  // Features
  features: {
    // Disable debug features in production
    debugMode: false,
    verboseLogging: false,
    showStackTraces: false,
  },
  
  // Caching
  cache: {
    // Longer cache times for production
    defaultTTL: 3600, // 1 hour
    enabled: true,
    useRedis: true,
  },
  
  // External services
  services: {
    // Use real external services
    mockUniversityAPI: false,
    mockPaymentProvider: false,
    useSandboxEndpoints: false,
  },
  
  // Performance
  performance: {
    // Enable performance optimizations
    enableCompression: true,
    enableCDN: true,
    preloadAssets: true,
  },
};