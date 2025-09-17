/**
 * Safe data access utilities to prevent undefined/null errors
 */

/**
 * Safely access nested object properties
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Safely access array length
 */
export function safeLength(arr: any): number {
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Safely access array items
 */
export function safeArrayItem<T>(arr: any, index: number, defaultValue: T): T {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index] !== undefined ? arr[index] : defaultValue;
}

/**
 * Safely access string properties
 */
export function safeString(str: any, defaultValue: string = ''): string {
  return typeof str === 'string' ? str : defaultValue;
}

/**
 * Safely access number properties
 */
export function safeNumber(num: any, defaultValue: number = 0): number {
  return typeof num === 'number' && !isNaN(num) ? num : defaultValue;
}

/**
 * Safely access boolean properties
 */
export function safeBoolean(bool: any, defaultValue: boolean = false): boolean {
  return typeof bool === 'boolean' ? bool : defaultValue;
}

/**
 * Safely access date properties
 */
export function safeDate(date: any, defaultValue: Date = new Date()): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safely access object properties with type checking
 */
export function safeObject<T>(obj: any, defaultValue: T): T {
  return obj && typeof obj === 'object' ? obj : defaultValue;
}

/**
 * Safely access function properties
 */
export function safeFunction<T extends (...args: any[]) => any>(
  fn: any, 
  defaultValue: T
): T {
  return typeof fn === 'function' ? fn : defaultValue;
}

/**
 * Create a safe accessor for API responses
 */
export function createSafeAccessor<T>(data: any, defaultValue: T) {
  return {
    get: (path: string) => safeGet(data, path, defaultValue),
    length: () => safeLength(data),
    item: (index: number) => safeArrayItem(data, index, defaultValue),
    string: (path: string, fallback: string = '') => safeString(safeGet(data, path, fallback), fallback),
    number: (path: string, fallback: number = 0) => safeNumber(safeGet(data, path, fallback), fallback),
    boolean: (path: string, fallback: boolean = false) => safeBoolean(safeGet(data, path, fallback), fallback),
    date: (path: string, fallback: Date = new Date()) => safeDate(safeGet(data, path, fallback), fallback),
    object: (path: string, fallback: any = {}) => safeObject(safeGet(data, path, fallback), fallback),
    array: (path: string, fallback: any[] = []) => {
      const arr = safeGet(data, path, fallback);
      return Array.isArray(arr) ? arr : fallback;
    }
  };
}

/**
 * Safe API response wrapper
 */
export interface SafeApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  loading: boolean;
}

export function createSafeApiResponse<T>(
  data: T | null = null,
  error: string | null = null,
  success: boolean = false,
  loading: boolean = false
): SafeApiResponse<T> {
  return { data, error, success, loading };
}

/**
 * Safe array operations
 */
export const safeArray = {
  map: <T, U>(arr: any, fn: (item: T, index: number) => U, fallback: U[] = []): U[] => {
    return Array.isArray(arr) ? arr.map(fn) : fallback;
  },
  
  filter: <T>(arr: any, fn: (item: T, index: number) => boolean, fallback: T[] = []): T[] => {
    return Array.isArray(arr) ? arr.filter(fn) : fallback;
  },
  
  find: <T>(arr: any, fn: (item: T, index: number) => boolean, fallback: T | null = null): T | null => {
    return Array.isArray(arr) ? arr.find(fn) || fallback : fallback;
  },
  
  some: (arr: any, fn: (item: any, index: number) => boolean): boolean => {
    return Array.isArray(arr) ? arr.some(fn) : false;
  },
  
  every: (arr: any, fn: (item: any, index: number) => boolean): boolean => {
    return Array.isArray(arr) ? arr.every(fn) : false;
  },
  
  reduce: <T, U>(arr: any, fn: (acc: U, item: T, index: number) => U, initial: U): U => {
    return Array.isArray(arr) ? arr.reduce(fn, initial) : initial;
  }
};
