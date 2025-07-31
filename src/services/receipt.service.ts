import { apiService } from './api.service';
import { Receipt, CreateReceiptRequest, ReturnReceiptRequest, ReturnItemsRequest, PendingReceipt, CreatePendingReceiptRequest, SignPendingReceiptRequest } from '../types';

export const receiptService = {
  // Get all receipts
  async getAll(): Promise<Receipt[]> {
    return apiService.get<Receipt[]>('/receipts');
  },

  // Create a new receipt
  async create(receiptData: CreateReceiptRequest): Promise<Receipt> {
    return apiService.post<Receipt>('/receipts/sign', receiptData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Update an existing receipt
  async update(id: string, receiptData: CreateReceiptRequest): Promise<Receipt> {
    return apiService.patch<Receipt>(`/receipts/${id}`, receiptData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Delete a receipt
  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/receipts/${id}`);
  },

  // Return items from receipt
  async returnItems(returnData: ReturnReceiptRequest): Promise<void> {
    return apiService.patch<void>('/receipts/return', returnData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Return specific items from receipt
  async returnSelectedItems(returnData: ReturnItemsRequest): Promise<void> {
    const { receiptId, receiptItemIds } = returnData;
    return apiService.patch<void>(`/receipts/return/${receiptId}`, { receiptItemIds }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Get receipt by ID
  async getById(receiptId: string): Promise<Receipt> {
    return apiService.get<Receipt>(`/receipts/${receiptId}`);
  },

  // Get pending receipts
  async getPendingReceipts(): Promise<PendingReceipt[]> {
    return apiService.get<PendingReceipt[]>('/receipts/pending');
  },

  // Get current user's pending receipts
  async getMyPendingReceipts(): Promise<PendingReceipt[]> {
    return apiService.get<PendingReceipt[]>('/receipts/my-pending');
  },

  // Get available items for new receipts (admin only)
  async getAvailableItems(): Promise<any[]> {
    return apiService.get<any[]>('/receipts/available-items');
  },

  // Create pending receipt (admin only)
  async createPendingReceipt(data: CreatePendingReceiptRequest): Promise<PendingReceipt> {
    return apiService.post<PendingReceipt>('/receipts/create-pending', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Sign pending receipt
  async signPendingReceipt(receiptId: string, data: SignPendingReceiptRequest): Promise<Receipt> {
    return apiService.post<Receipt>(`/receipts/sign/${receiptId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
