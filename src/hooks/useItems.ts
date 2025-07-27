import { useState, useEffect } from 'react';
import { itemService } from '../services';
import { Item, CreateItemRequest } from '../types';

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
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

  const createItem = async (itemData: CreateItemRequest): Promise<boolean> => {
    try {
      setError(null);
      await itemService.create(itemData);
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      console.error('Failed to create item:', err);
      return false;
    }
  };

  const updateItem = async (itemId: string, itemData: Partial<CreateItemRequest>): Promise<boolean> => {
    try {
      setError(null);
      await itemService.update(itemId, itemData);
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      console.error('Failed to update item:', err);
      return false;
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

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      setError(null);
      await itemService.delete(itemId);
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      console.error('Failed to delete item:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    markItemReceived,
    markItemReturned,
  };
};
