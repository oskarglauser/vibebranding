/**
 * Application configuration constants
 */

/**
 * Get the appropriate API URL based on the current environment
 */
export function getApiUrl(): string {
  // Always use same-origin API
  // In local dev, Vite proxy forwards /api to production
  // In production, /api routes to Vercel serverless functions
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
