import { useState, useEffect } from 'react';
import { userService } from '../services';
import { User, CreateUserRequest } from '../types';
import { extractApiError, extractBulkDeleteResponse } from '../utils';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]); // Ensure empty array on error
      // Removed console.error
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserRequest): Promise<{ success: boolean; error?: { status: number; message: string } }> => {
    try {
      setError(null);
      await userService.create(userData);
      await fetchUsers(); // Refresh the list
      return { success: true };
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
      // Removed console.error
      
      // Return detailed error information for conflict handling
      if (apiError.status === 409) {
        return { 
          success: false, 
          error: { 
            status: 409, 
            message: apiError.message 
          } 
        };
      }
      
      return { success: false };
    }
  };

  const updateUser = async (userId: string, userData: Partial<CreateUserRequest>): Promise<{ success: boolean; error?: { status: number; message: string } }> => {
    try {
      setError(null);
      await userService.update(userId, userData);
      await fetchUsers(); // Refresh the list
      return { success: true };
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
      // Removed console.error
      
      // Return detailed error information for conflict handling
      if (apiError.status === 409) {
        return { 
          success: false, 
          error: { 
            status: 409, 
            message: apiError.message 
          } 
        };
      }
      
      // Return detailed error information for forbidden actions (like last admin)
      if (apiError.status === 403) {
        return { 
          success: false, 
          error: { 
            status: 403, 
            message: apiError.message 
          } 
        };
      }
      
      return { success: false };
    }
  };

  const deleteManyUsers = async (userIds: string[]): Promise<{ 
    success: boolean; 
    error?: string; 
    isConflict?: boolean;
    bulkError?: { 
      deletedCount: number; 
      errors: string[]; 
      message: string; 
    } 
  }> => {
    try {
      setError(null);
      const response = await userService.deleteMany(userIds);
      
      // Check if response contains bulk delete information
      const { isSuccess, hasConflicts, bulkResult } = extractBulkDeleteResponse(response);
      
      if (isSuccess) {
        await fetchUsers(); // Refresh the list
        return { success: true };
      } else if (hasConflicts && bulkResult) {
        // Handle bulk delete conflicts (still refresh to show what was deleted)
        await fetchUsers();
        return { 
          success: false, 
          error: bulkResult.message,
          isConflict: true,
          bulkError: {
            deletedCount: bulkResult.deletedCount,
            errors: bulkResult.errors,
            message: bulkResult.message
          }
        };
      } else {
        // Unknown response format
        await fetchUsers();
        return { 
          success: false, 
          error: 'תגובה לא צפויה מהשרת'
        };
      }
    } catch (err) {
      // Handle actual HTTP errors
      const apiError = extractApiError(err);
      
      if (!apiError.isConflict) {
        setError(apiError.message);
      }
      
      // Removed console.error
      return { 
        success: false, 
        error: apiError.message,
        isConflict: apiError.isConflict
      };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteManyUsers,
  };
};
