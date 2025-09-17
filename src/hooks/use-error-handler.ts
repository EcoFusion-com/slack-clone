/**
 * Custom hook for handling errors throughout the application.
 */
import { useCallback } from 'react';
import { config } from '../lib/config';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: Error | unknown,
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    // Extract error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : fallbackMessage;

    // Log error with context
    if (logError) {
      console.error(`[Error Handler${context ? ` - ${context}` : ''}]:`, {
        error: errorMessage,
        originalError: error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }

    // Show user-friendly error message
    if (showToast) {
      // TODO: Implement toast notification system
      // For now, use alert as fallback
      alert(`Error: ${errorMessage}`);
    }

    // In production, send to error tracking service
    if (config.environment === 'production' && logError) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('Production error:', {
        message: errorMessage,
        context,
        error: error instanceof Error ? {
          name: error.name,
          stack: error.stack,
          message: error.message
        } : error,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context, options);
      throw error; // Re-throw to allow calling code to handle if needed
    }
  }, [handleError]);

  const handleApiError = useCallback((
    error: any,
    context?: string
  ) => {
    let errorMessage = 'An API error occurred';
    
    if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    handleError(errorMessage, context, {
      showToast: true,
      logError: true
    });
  }, [handleError]);

  const handleWebSocketError = useCallback((
    error: any,
    context?: string
  ) => {
    let errorMessage = 'WebSocket connection error';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    handleError(errorMessage, context, {
      showToast: true,
      logError: true
    });
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    handleApiError,
    handleWebSocketError
  };
}
