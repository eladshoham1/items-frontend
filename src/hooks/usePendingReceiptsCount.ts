import { useState, useEffect, useCallback } from 'react';
import { Receipt } from '../types';
import { receiptService } from '../services';
import { usePendingReceiptsContext } from '../contexts';

export interface UsePendingReceiptsCountReturn {
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refreshCount: () => Promise<void>;
  userSpecificCount: number; // Count of receipts specifically for current user
  decrementCount: (receiptId?: string) => void; // Immediate decrement for optimistic updates
}

export const usePendingReceiptsCount = (userProfile?: any, isAdmin?: boolean) => {
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get context for global refresh management (with error handling)
  const { registerRefreshCallback, registerDecrementCallback } = usePendingReceiptsContext();

  const fetchPendingReceipts = useCallback(async () => {
    if (!userProfile) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await receiptService.getAll();
      if (Array.isArray(data)) {
        // Filter only unsigned receipts
        const unsignedReceipts = data.filter(receipt => !receipt.isSigned);
        setPendingReceipts(unsignedReceipts);
      } else {
        setPendingReceipts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending receipts');
      setPendingReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  const refreshCount = useCallback(async () => {
    await fetchPendingReceipts();
  }, [fetchPendingReceipts]);

  // Filter pending receipts based on user role and location
  const userPendingReceipts = useCallback(() => {
    if (!userProfile) return [];
    
    if (isAdmin) {
      return pendingReceipts; // Admins see all pending receipts
    }
    
    // Non-admin users see pending receipts from their location
    return pendingReceipts.filter(receipt => {
      const signedByLocation = receipt.signedBy?.location?.name;
      const createdByLocation = receipt.createdBy?.location?.name;
      const userLocation = userProfile.location;
      
      // Show receipt if either the signer or creator is from the same location as current user
      return signedByLocation === userLocation || createdByLocation === userLocation;
    });
  }, [pendingReceipts, isAdmin, userProfile]);

  // Count receipts specifically assigned to current user (for signing)
  const userSpecificReceipts = useCallback(() => {
    if (!userProfile) return [];
    
    const userLocationReceipts = userPendingReceipts();
    
    // For non-admin users, only count receipts they can actually sign
    if (!isAdmin) {
      return userLocationReceipts.filter(receipt => 
        receipt.signedById && receipt.signedById === userProfile.id
      );
    }
    
    return userLocationReceipts;
  }, [userPendingReceipts, isAdmin, userProfile]);

  useEffect(() => {
    fetchPendingReceipts();
    
    // Set up polling to refresh count every 60 seconds (not too frequent)
    const interval = setInterval(fetchPendingReceipts, 60000);
    
    return () => clearInterval(interval);
  }, [fetchPendingReceipts]);

  // Listen for visibility changes to refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userProfile) {
        fetchPendingReceipts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchPendingReceipts, userProfile]);

  // Optimistic update function for immediate UI response
  const decrementCount = useCallback((receiptId?: string) => {
    setPendingReceipts(prev => {
      if (receiptId) {
        // Remove the specific receipt that was signed/deleted
        return prev.filter(r => r.id !== receiptId);
      } else if (prev.length > 0) {
        // Fallback: Remove the first receipt that the current user can sign
        const userLocationReceipts = isAdmin ? prev : prev.filter(receipt => {
          const signedByLocation = receipt.signedBy?.location?.name;
          const createdByLocation = receipt.createdBy?.location?.name;
          const userLocation = userProfile?.location;
          return signedByLocation === userLocation || createdByLocation === userLocation;
        });
        
        if (!isAdmin) {
          const userSignableReceipts = userLocationReceipts.filter(receipt => 
            receipt.signedById && receipt.signedById === userProfile?.id
          );
          if (userSignableReceipts.length > 0) {
            return prev.filter(r => r.id !== userSignableReceipts[0].id);
          }
        } else if (userLocationReceipts.length > 0) {
          return prev.filter(r => r.id !== userLocationReceipts[0].id);
        }
      }
      return prev;
    });
  }, [isAdmin, userProfile]);

  // Register callbacks with the global context
  useEffect(() => {
    try {
      registerRefreshCallback(refreshCount);
      registerDecrementCallback(decrementCount);
    } catch (error) {
      console.warn('Failed to register pending receipts callbacks:', error);
    }
  }, [registerRefreshCallback, registerDecrementCallback, refreshCount, decrementCount]);

  const filteredPendingReceipts = userPendingReceipts();
  const specificUserReceipts = userSpecificReceipts();

  return {
    pendingCount: filteredPendingReceipts.length,
    userSpecificCount: specificUserReceipts.length,
    loading,
    error,
    refreshCount,
    decrementCount,
  };
};