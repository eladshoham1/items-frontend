import { useState, useEffect, useCallback } from 'react';
import { Receipt, CreateReceiptRequest, UpdateReceiptRequest, ReturnReceiptRequest, ReturnItemsRequest, SignPendingReceiptRequest } from '../types';
import { receiptService } from '../services';

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]); // Changed from PendingReceipt[] to Receipt[]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receiptService.getAll();
      // Ensure data is an array to prevent "map is not a function" errors
      if (Array.isArray(data)) {
        // Separate signed and unsigned receipts
        const signedReceipts = data.filter(receipt => receipt.isSigned);
        const unsignedReceipts = data.filter(receipt => !receipt.isSigned);
        
        setReceipts(signedReceipts);
        setPendingReceipts(unsignedReceipts);
      } else if (data === null || data === undefined) {
        setReceipts([]);
        setPendingReceipts([]);
      } else {
        setReceipts([]);
        setPendingReceipts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch receipts');
      setReceipts([]); // Ensure empty array on error
      setPendingReceipts([]);
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
      // Re-throw the error so the component can handle specific error types (like 409)
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReceipt = useCallback(async (
    id: string,
    receiptData: UpdateReceiptRequest
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
      // Re-throw the error so the component can handle specific error types (like 409)
      throw err;
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

  // Pending receipt methods
  const fetchPendingReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receiptService.getPendingReceipts();
      if (Array.isArray(data)) {
        setPendingReceipts(data);
      } else {
        setPendingReceipts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending receipts');
      setPendingReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyPendingReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receiptService.getMyPendingReceipts();
      if (Array.isArray(data)) {
        setPendingReceipts(data);
      } else {
        setPendingReceipts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending receipts');
      setPendingReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const signPendingReceipt = useCallback(async (
    receiptId: string,
    data: SignPendingReceiptRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const signedReceipt = await receiptService.signPendingReceipt(receiptId, data);
      // Remove from pending receipts
      setPendingReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
      // Add to regular receipts
      setReceipts(prev => [signedReceipt, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign pending receipt');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return {
    receipts,
    pendingReceipts,
    loading,
    error,
    fetchReceipts,
    fetchPendingReceipts,
    fetchMyPendingReceipts,
    createReceipt,
    signPendingReceipt,
    updateReceipt,
    deleteReceipt,
    returnReceipt,
    returnSelectedItems,
  };
};
