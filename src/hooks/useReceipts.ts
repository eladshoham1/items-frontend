import { useState, useEffect, useCallback } from 'react';
import { Receipt, CreateReceiptRequest, ReturnReceiptRequest, ReturnItemsRequest } from '../types';
import { receiptService } from '../services';

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receiptService.getAll();
      console.log('Fetched receipts:', data);
      // Ensure data is an array to prevent "map is not a function" errors
      if (Array.isArray(data)) {
        setReceipts(data);
      } else if (data === null || data === undefined) {
        console.warn('getAll returned null/undefined data');
        setReceipts([]);
      } else {
        console.warn('getAll returned non-array data:', data);
        setReceipts([]);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch receipts');
      setReceipts([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  const createReceipt = useCallback(async (
    receiptData: CreateReceiptRequest, 
    file?: File
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newReceipt = await receiptService.create(receiptData);
      setReceipts(prev => [newReceipt, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create receipt');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReceipt = useCallback(async (
    id: string,
    receiptData: CreateReceiptRequest,
    file?: File
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await receiptService.update(id, receiptData);
      // Refetch all receipts to get updated data
      await fetchReceipts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update receipt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchReceipts]);

  const deleteReceipt = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await receiptService.delete(id);
      // Remove the receipt from local state
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete receipt');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const returnReceipt = useCallback(async (
    returnData: ReturnReceiptRequest,
    file?: File
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await receiptService.returnItems(returnData);
      // Since returnItems doesn't return the updated receipt, we refetch all receipts
      await fetchReceipts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return receipt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchReceipts]);

  const returnSelectedItems = useCallback(async (
    returnData: ReturnItemsRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await receiptService.returnSelectedItems(returnData);
      // Refetch all receipts to get updated data
      await fetchReceipts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return selected items');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchReceipts]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return {
    receipts,
    loading,
    error,
    fetchReceipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    returnReceipt,
    returnSelectedItems,
  };
};
