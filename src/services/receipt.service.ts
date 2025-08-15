import { apiService } from './api.service';
import { Receipt, CreateReceiptRequest, UpdateReceiptRequest, SignReceiptRequest, ReturnReceiptRequest, ReturnItemsRequest, SignPendingReceiptRequest } from '../types';

export const receiptService = {
  // Get all receipts
  async getAll(): Promise<Receipt[]> {
    console.log('🔥 API CALL: GET /receipts - Called from:', new Error().stack);
    return apiService.get<Receipt[]>('/receipts');
  },

  // Get receipt by ID
  async getById(receiptId: string): Promise<Receipt> {
    return apiService.get<Receipt>(`/receipts/${receiptId}`);
  },

  // Create a new receipt (Admin only)
  async create(receiptData: CreateReceiptRequest): Promise<Receipt> {
    return apiService.post<Receipt>('/receipts', receiptData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Update an existing receipt (Admin only)
  async update(id: string, receiptData: UpdateReceiptRequest): Promise<Receipt> {
    return apiService.patch<Receipt>(`/receipts/${id}`, receiptData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Delete a receipt (Admin only)
  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/receipts/${id}`);
  },

  // Sign a receipt (User can only sign receipts assigned to them)
  async signReceipt(receiptId: string, signatureData: SignReceiptRequest): Promise<Receipt> {
    return apiService.post<Receipt>(`/receipts/${receiptId}/sign`, signatureData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Get pending receipts (unsigned receipts)
  async getPendingReceipts(): Promise<Receipt[]> {
    const allReceipts = await this.getAll();
    return allReceipts.filter(receipt => !receipt.isSigned);
  },

  // Get current user's pending receipts
  async getMyPendingReceipts(): Promise<Receipt[]> {
    const allReceipts = await this.getAll();
    // This will need to be filtered on the backend based on current user
    return allReceipts.filter(receipt => !receipt.isSigned);
  },

  // Get available items for new receipts (admin only)
  // Note: This endpoint might not exist in your backend, you may need to add it
  async getAvailableItems(): Promise<any[]> {
    return apiService.get<any[]>('/items/available');
  },

  // Sign pending receipt - This is the same as signReceipt
  async signPendingReceipt(receiptId: string, data: SignPendingReceiptRequest): Promise<Receipt> {
    return this.signReceipt(receiptId, { signature: data.signature });
  },

  // Legacy methods for backward compatibility
  async returnItems(returnData: ReturnReceiptRequest): Promise<void> {
    // This functionality might need to be implemented differently
    // depending on your backend requirements
    throw new Error('Return items functionality needs to be implemented based on backend requirements');
  },

  async returnSelectedItems(returnData: ReturnItemsRequest): Promise<void> {
    // This functionality might need to be implemented differently
    // depending on your backend requirements
    throw new Error('Return selected items functionality needs to be implemented based on backend requirements');
  },
};
