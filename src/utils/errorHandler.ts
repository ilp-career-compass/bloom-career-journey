import { logger } from '@/lib/logger';

// Error handling utilities for assessment components

export const safeObjectEntries = (obj: any): [string, any][] => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.entries(obj);
};

export const safeObjectKeys = (obj: any): string[] => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.keys(obj);
};

export const safeArrayFilter = <T>(arr: T[] | undefined | null, predicate: (item: T) => boolean): T[] => {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter(predicate);
};

export const safeArrayMap = <T, U>(arr: T[] | undefined | null, mapper: (item: T) => U): U[] => {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map(mapper);
};

export const safeArrayFind = <T>(arr: T[] | undefined | null, predicate: (item: T) => boolean): T | undefined => {
  if (!Array.isArray(arr)) {
    return undefined;
  }
  return arr.find(predicate);
};

export const safeStringTrim = (str: any): string => {
  if (typeof str !== 'string') {
    return '';
  }
  return str.trim();
};

export const safeBoolean = (value: any): boolean => {
  return Boolean(value);
};

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Database error handling
export const handleDatabaseError = (error: any, context: string): void => {
  logger.error(`❌ Database error in ${context}:`, error);
  
  if (error?.message) {
    logger.error(`Error message: ${error.message}`);
  }
  
  if (error?.details) {
    logger.error(`Error details: ${error.details}`);
  }
  
  if (error?.hint) {
    logger.error(`Error hint: ${error.hint}`);
  }
};

// API response validation
export const validateApiResponse = (data: any, context: string): boolean => {
  if (!data) {
    logger.warn(`⚠️ No data received in ${context}`);
    return false;
  }
  
  if (Array.isArray(data) && data.length === 0) {
    logger.warn(`⚠️ Empty array received in ${context}`);
    return false;
  }
  
  return true;
};
