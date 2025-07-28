import { useState, useEffect } from 'react';
import { itemService } from '../services';
import { Item, CreateItemRequest } from '../types';
import { extractApiError, extractBulkDeleteResponse } from '../utils';

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itemService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setItems([]); // Ensure empty array on error
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      setError(null);
      const data = await itemService.getAvailableItems();
      setAvailableItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available items');
      setAvailableItems([]); // Ensure empty array on error
      console.error('Failed to fetch available items:', err);
    }
  };

  const createItem = async (itemData: CreateItemRequest): Promise<{ success: boolean; error?: string; isConflict?: boolean }> => {
    try {
      setError(null);
      await itemService.create(itemData);
      await fetchItems(); // Refresh the list
      return { success: true };
    } catch (err) {
      const apiError = extractApiError(err);
      // Don't set general error state for conflicts - let the component handle it
      if (!apiError.isConflict) {
        setError(apiError.message);
      }
      console.error('Failed to create item:', err);
      return { 
        success: false, 
        error: apiError.message,
        isConflict: apiError.isConflict
      };
    }
  };

  const updateItem = async (itemId: string, itemData: Partial<CreateItemRequest>): Promise<{ success: boolean; error?: string; isConflict?: boolean }> => {
    try {
      setError(null);
      await itemService.update(itemId, itemData);
      await fetchItems(); // Refresh the list
      return { success: true };
    } catch (err) {
      const apiError = extractApiError(err);
      // Don't set general error state for conflicts - let the component handle it
      if (!apiError.isConflict) {
        setError(apiError.message);
      }
      console.error('Failed to update item:', err);
      return { 
        success: false, 
        error: apiError.message,
        isConflict: apiError.isConflict
      };
    }
  };

  const markItemReceived = async (itemId: string): Promise<boolean> => {
    try {
      setError(null);
      await itemService.markReceived(itemId);
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as received');
      console.error('Failed to mark item as received:', err);
      return false;
    }
  };

  const markItemReturned = async (itemId: string): Promise<boolean> => {
    try {
      setError(null);
      await itemService.markReturned(itemId);
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as returned');
      console.error('Failed to mark item as returned:', err);
      return false;
    }
  };

  const deleteItem = async (itemId: string): Promise<{ success: boolean; error?: string; isConflict?: boolean }> => {
    try {
      setError(null);
      await itemService.delete(itemId);
      await fetchItems(); // Refresh the list
      return { success: true };
    } catch (err) {
      const apiError = extractApiError(err);
      
      // Don't set general error state for conflicts - let the component handle it
      if (!apiError.isConflict) {
        setError(apiError.message);
      }
      
      console.error('Failed to delete item:', err);
      return { 
        success: false, 
        error: apiError.message,
        isConflict: apiError.isConflict
      };
    }
  };

  const deleteManyItems = async (itemIds: string[]): Promise<{ 
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
      const response = await itemService.deleteMany(itemIds);
      
      // Check if response contains bulk delete information
      const { isSuccess, hasConflicts, bulkResult } = extractBulkDeleteResponse(response);
      
      if (isSuccess) {
        await fetchItems(); // Refresh the list
        return { success: true };
      } else if (hasConflicts && bulkResult) {
        // Handle bulk delete conflicts (still refresh to show what was deleted)
        await fetchItems();
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
        await fetchItems();
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
      
      console.error('Failed to delete items:', err);
      return { 
        success: false, 
        error: apiError.message,
        isConflict: apiError.isConflict
      };
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    availableItems,
    loading,
    error,
    refetch: fetchItems,
    refetchAvailableItems: fetchAvailableItems,
    createItem,
    updateItem,
    deleteItem,
    deleteManyItems,
    markItemReceived,
    markItemReturned,
  };
};
