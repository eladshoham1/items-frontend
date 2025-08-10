import { AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
  isConflict: boolean;
  isValidation: boolean;
}

export interface BulkDeleteError {
  deleted: boolean;
  deletedCount: number;
  message: string;
  errors: string[];
}

/**
 * Extracts meaningful error information from API responses
 */
export const extractApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 500;
    
    let message = 'שגיאה לא צפויה';
    
    // Handle specific status codes
    switch (status) {
      case 409:
        message = getConflictMessage(axiosError);
        break;
      case 400:
        message = getValidationMessage(axiosError);
        break;
      case 403:
        message = getForbiddenMessage(axiosError);
        break;
      case 404:
        message = 'הפריט לא נמצא';
        break;
      case 500:
        message = 'שגיאת שרת פנימית';
        break;
      default:
        const responseData = axiosError.response?.data as any;
        message = responseData?.message || axiosError.message || 'שגיאה לא צפויה';
    }
    
    return {
      status,
      message,
      isConflict: status === 409 || status === 403,
      isValidation: status === 400,
    };
  }
  
  // Fallback for non-HTTP errors
  return {
    status: 500,
    message: error instanceof Error ? error.message : 'שגיאה לא צפויה',
    isConflict: false,
    isValidation: false,
  };
};

/**
 * Gets user-friendly message for 409 Conflict errors
 */
const getConflictMessage = (error: AxiosError): string => {
  const url = error.config?.url || '';
  const method = error.config?.method?.toUpperCase() || '';
  
  // Check if it's a delete operation
  if (method === 'DELETE') {
    if (url.includes('/users/')) {
      return 'לא ניתן למחוק משתמש זה כיוון שהוא מקושר לקבלות פעילות. יש להחזיר תחילה את כל הפריטים המוקצים למשתמש זה.';
    } else if (url.includes('/items/')) {
      return 'לא ניתן למחוק פריט זה כיוון שהוא מוקצה כרגע למשתמש. יש להחזיר תחילה את הפריט או לבטל את הקצאתו.';
    }
  }
  
  // Check server response for specific conflict messages
  const responseData = error.response?.data as any;
  if (responseData?.message) {
    // Translate common server messages to Hebrew
    const serverMessage = responseData.message.toLowerCase();
    
    if (serverMessage.includes('user') && serverMessage.includes('assigned')) {
      return 'המשתמש מקושר לפריטים פעילים ולא ניתן למחוק אותו';
    }
    
    if (serverMessage.includes('item') && serverMessage.includes('assigned')) {
      return 'הפריט מוקצה כרגע ולא ניתן למחוק אותו';
    }
    
    if (serverMessage.includes('receipt') && serverMessage.includes('active')) {
      return 'קיימות קבלות פעילות המונעות מחיקה';
    }
  }
  
  // Generic conflict message
  return 'הפעולה נכשלה בגלל התנגשות נתונים. ייתכן שהפריט מקושר לנתונים אחרים במערכת.';
};

// New: translate 403 Forbidden to friendly Hebrew
const getForbiddenMessage = (error: AxiosError): string => {
  const responseData = error.response?.data as any;
  const raw = typeof responseData?.message === 'string' ? responseData.message : '';
  const m = raw.toLowerCase();

  if (m.includes('cannot update an item that is part of a signed receipt')) {
    return 'לא ניתן לעדכן פריט שהוא חלק מקבלה חתומה';
  }
  if (m.includes('forbidden') || m.includes('not allowed')) {
    return 'אין הרשאה לבצע פעולה זו';
  }
  // Fallback to server message if provided
  return raw || 'פעולה אסורה';
};

/**
 * Gets user-friendly message for 400 Bad Request errors
 */
const getValidationMessage = (error: AxiosError): string => {
  const responseData = error.response?.data as any;
  
  if (responseData?.message) {
    return responseData.message;
  }
  
  if (responseData?.errors && Array.isArray(responseData.errors)) {
    return responseData.errors.join(', ');
  }
  
  return 'נתונים לא תקינים';
};

/**
 * Creates a user-friendly conflict resolution message
 */
export const getConflictResolutionMessage = (type: 'user' | 'item'): string => {
  if (type === 'user') {
    return `
פתרונות אפשריים:
• החזר את כל הפריטים המוקצים למשתמש זה
• בטל את הקצאת הפריטים דרך מסך הקבלות
• מחק תחילה את הקבלות הפעילות של המשתמש
    `.trim();
  } else {
    return `
פתרונות אפשריים:
• החזר את הפריט דרך מסך הקבלות
• בטל את הקצאת הפריט למשתמש
• מחק את הקבלה המכילה את הפריט
    `.trim();
  }
};

/**
 * Extracts bulk delete error information from API responses
 */
export const extractBulkDeleteError = (error: unknown): { isBulkError: boolean; bulkError?: BulkDeleteError; apiError?: ApiError } => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const responseData = axiosError.response?.data as any;
    
    // Check if it's a bulk delete error response (now returns 200 OK with error details)
    if (responseData && 
        typeof responseData.deleted === 'boolean' && 
        typeof responseData.deletedCount === 'number' && 
        responseData.message && 
        Array.isArray(responseData.errors)) {
      
      return {
        isBulkError: true,
        bulkError: {
          deleted: responseData.deleted,
          deletedCount: responseData.deletedCount,
          message: responseData.message,
          errors: responseData.errors
        }
      };
    }
  }
  
  // Fall back to regular API error extraction
  return {
    isBulkError: false,
    apiError: extractApiError(error)
  };
};

/**
 * Extracts bulk delete information from successful API responses (200 OK)
 */
export const extractBulkDeleteResponse = (responseData: any): { 
  isSuccess: boolean; 
  hasConflicts: boolean; 
  bulkResult?: BulkDeleteError 
} => {
  // Check if it's a bulk delete response structure
  if (responseData && 
      typeof responseData.deleted === 'boolean' && 
      typeof responseData.deletedCount === 'number' && 
      responseData.message && 
      Array.isArray(responseData.errors)) {
    
    return {
      isSuccess: responseData.deleted && responseData.errors.length === 0,
      hasConflicts: !responseData.deleted || responseData.errors.length > 0,
      bulkResult: {
        deleted: responseData.deleted,
        deletedCount: responseData.deletedCount,
        message: responseData.message,
        errors: responseData.errors
      }
    };
  }
  
  // Not a bulk delete response, assume success
  return {
    isSuccess: true,
    hasConflicts: false
  };
};
