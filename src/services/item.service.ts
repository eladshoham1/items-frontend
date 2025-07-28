import { apiService } from './api.service';
import { Item, CreateItemRequest } from '../types';

export const itemService = {
  // Get all items
  async getAll(): Promise<Item[]> {
    return apiService.get<Item[]>('/items');
  },

  // Get only available items (not currently assigned to active receipts)
  async getAvailableItems(): Promise<Item[]> {
    const response = await apiService.get<{ items: Item[]; total: number; timestamp: string }>('/items/available');
    return response.items || [];
  },

  // Create a new item
  async create(itemData: CreateItemRequest): Promise<Item> {
    return apiService.post<Item>('/items', itemData);
  },

  // Update an existing item
  async update(itemId: string, itemData: Partial<CreateItemRequest>): Promise<Item> {
    return apiService.patch<Item>(`/items/${itemId}`, itemData);
  },

  // Mark item as received
  async markReceived(itemId: string): Promise<void> {
    return apiService.post<void>(`/items/${itemId}/receive`);
  },

  // Mark item as returned
  async markReturned(itemId: string): Promise<void> {
    return apiService.post<void>(`/items/${itemId}/return`);
  },

  // Get item by ID
  async getById(itemId: string): Promise<Item> {
    return apiService.get<Item>(`/items/${itemId}`);
  },

  // Delete an item
  async delete(itemId: string): Promise<void> {
    console.log('delete item id:', itemId);
    return apiService.delete<void>(`/items/${itemId}`);
  },
};
