/**
 * Application configuration constants
 */

/**
 * Get the appropriate API URL based on the current environment
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return '/api/fonts/convert';
  }

  const hostname = window.location.hostname;

  // Local development - use external API temporarily until we deploy
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'https://vector-api-alpha.vercel.app/api/convert';
  }

  // Production and Vercel deployments - use same-origin API
  return '/api/fonts/convert';
}

export const API_CONFIG = {
  vectorApiUrl: getApiUrl(),
  maxTextLength: 200,
  maxFileSize: 10 * 1024 * 1024, // 10MB
} as const;

export const CORS_ORIGINS = [
  'https://gologotype.com',
  'https://www.gologotype.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
] as const;
