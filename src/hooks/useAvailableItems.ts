import { useState, useEffect } from 'react';
import { itemService } from '../services';
import { Item } from '../types';

export const useAvailableItems = () => {
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itemService.getAvailableItems();
      setAvailableItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available items');
      setAvailableItems([]); // Ensure empty array on error
      // Removed console.error to avoid noisy logs
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableItems();
  }, []);

  return {
    availableItems,
    loading,
    error,
    refetch: fetchAvailableItems,
  };
};
