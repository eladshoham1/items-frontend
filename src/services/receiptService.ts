import { apiService } from './api.service';
import { Receipt, CreateReceiptRequest, ReturnReceiptRequest } from '../types';

class ReceiptService {
  async getAllReceipts(): Promise<Receipt[]> {
    return apiService.get<Receipt[]>('/receipts');
  }

  async createReceipt(receiptData: CreateReceiptRequest, file?: File): Promise<Receipt> {
    const formData = new FormData();
    formData.append('userId', receiptData.userId);
    formData.append('items', JSON.stringify(receiptData.items));
    formData.append('signature', receiptData.signature);
    
    if (file) {
      formData.append('signatureFile', file);
    }
    
    return apiService.post<Receipt>('/receipts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async returnReceipt(returnData: ReturnReceiptRequest, file?: File): Promise<Receipt> {
    const formData = new FormData();
    formData.append('receiptId', returnData.receiptId);
    formData.append('signature', returnData.signature);
    
    if (file) {
      formData.append('signatureFile', file);
    }
    
    return apiService.patch<Receipt>('/receipts/return', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const receiptService = new ReceiptService();
