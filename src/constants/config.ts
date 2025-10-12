/**
 * Application configuration constants
 */

/**
 * Get the appropriate API URL based on the current environment
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname;

  // Use the correct vector API endpoint
  const VECTOR_API_URL = 'https://vector-api-alpha.vercel.app/api/convert';

  // Production
  if (hostname === 'gologotype.com' || hostname === 'www.gologotype.com') {
    return VECTOR_API_URL;
  }

  // Staging/Vercel preview deployments
  if (hostname.includes('.vercel.app')) {
    return VECTOR_API_URL;
  }

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use deployed vector-api
    return VECTOR_API_URL;
  }

  // Fallback
  return VECTOR_API_URL;
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
