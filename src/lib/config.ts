/**
 * Frontend configuration with environment validation.
 */

interface Config {
  apiBaseUrl: string;
  websocketUrl: string;
  clerkPublishableKey: string;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableDebugLogging: boolean;
}

function validateConfig(): Config {
  // Only require Clerk key, others have defaults
  const requiredEnvVars = [
    'VITE_CLERK_PUBLISHABLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  const config: Config = {
    // Use environment variables for all URLs
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || '',
    clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
    environment: (import.meta.env.MODE as Config['environment']) || 'development',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as Config['logLevel']) || 'info',
    enableDebugLogging: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true' || import.meta.env.MODE === 'development'
  };

  // Validate URLs (skip validation for relative paths used with Vite proxy)
  if (config.apiBaseUrl.startsWith('http://') || config.apiBaseUrl.startsWith('https://')) {
    try {
      new URL(config.apiBaseUrl);
    } catch {
      throw new Error(`Invalid API base URL: ${config.apiBaseUrl}`);
    }
  }

  if (config.websocketUrl && (config.websocketUrl.startsWith('ws://') || config.websocketUrl.startsWith('wss://'))) {
    try {
      new URL(config.websocketUrl);
    } catch {
      throw new Error(`Invalid WebSocket URL: ${config.websocketUrl}`);
    }
  }

  // Validate Clerk key format
  if (!config.clerkPublishableKey.startsWith('pk_')) {
    throw new Error(`Invalid Clerk publishable key format: ${config.clerkPublishableKey}`);
  }

  // Log configuration (without sensitive data)
  console.log('Configuration loaded:', {
    apiBaseUrl: config.apiBaseUrl,
    websocketUrl: config.websocketUrl,
    environment: config.environment,
    logLevel: config.logLevel,
    enableDebugLogging: config.enableDebugLogging,
    clerkKeyPrefix: config.clerkPublishableKey.substring(0, 10) + '...'
  });

  return config;
}

// Export validated configuration
export const config = validateConfig();

// Export individual config values for convenience
export const {
  apiBaseUrl,
  websocketUrl,
  clerkPublishableKey,
  environment,
  logLevel,
  enableDebugLogging
} = config;
