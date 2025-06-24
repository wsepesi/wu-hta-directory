import { developmentConfig } from './development';
import { stagingConfig } from './staging';
import { productionConfig } from './production';
import { env } from '@/lib/env';

// Select configuration based on environment
function getEnvironmentConfig() {
  switch (env.NODE_ENV) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Merge environment-specific config with base config
export const environmentConfig = getEnvironmentConfig();

// Export a unified config object
export const appConfig = {
  // Base configuration from env
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
  },
  
  // Merge with environment-specific settings
  ...environmentConfig,
  
  // Helper methods
  isProduction: () => env.NODE_ENV === 'production',
  isStaging: () => env.NODE_ENV === 'staging',
  isDevelopment: () => env.NODE_ENV === 'development',
  
  // Feature checks
  isFeatureEnabled: (feature: string) => {
    const features = env as any;
    return features[`ENABLE_${feature.toUpperCase()}`] ?? false;
  },
};