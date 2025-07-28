import { apiService } from './api.service';
import { Receipt, CreateReceiptRequest, ReturnReceiptRequest, ReturnItemsRequest } from '../types';

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
};
