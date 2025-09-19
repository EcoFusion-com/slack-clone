/**
 * WebSocket utility functions for dynamic protocol detection
 */

/**
 * Generates WebSocket URL with automatic protocol detection
 * @param backendUrl - The backend URL (e.g., http://localhost:8000 or https://api.example.com)
 * @param wsPath - The WebSocket path (default: '/ws')
 * @returns WebSocket URL with appropriate protocol (ws:// or wss://)
 */
export const getWebSocketUrl = (backendUrl?: string, wsPath: string = '/ws'): string => {
  // Use environment variable or fallback to config
  const url = backendUrl || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Extract host from URL
  const host = url.replace(/^https?:\/\//, '');
  
  // Security: Always use wss:// for HTTPS, only ws:// for localhost development
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
  const isHttps = window.location.protocol === "https:" || url.startsWith('https://');
  
  // Use wss:// for HTTPS or non-localhost, ws:// only for localhost development
  const wsProtocol = (isHttps || !isLocalhost) ? "wss:" : "ws:";
  
  return `${wsProtocol}//${host}${wsPath}`;
};

/**
 * Gets WebSocket URL from environment or generates dynamically
 * @param wsPath - The WebSocket path (default: '/ws')
 * @returns WebSocket URL
 */
export const getWebSocketUrlFromEnv = (wsPath: string = '/ws'): string => {
  // Check if VITE_WS_URL is explicitly set
  if ((import.meta as any).env?.VITE_WS_URL) {
    return (import.meta as any).env.VITE_WS_URL;
  }
  
  // Generate dynamically based on backend URL
  return getWebSocketUrl(undefined, wsPath);
};

/**
 * Validates WebSocket URL format
 * @param url - WebSocket URL to validate
 * @returns true if valid WebSocket URL
 */
export const isValidWebSocketUrl = (url: string): boolean => {
  try {
    const wsUrl = new URL(url);
    return wsUrl.protocol === 'ws:' || wsUrl.protocol === 'wss:';
  } catch {
    return false;
  }
};
