import { ReceiptFormData, ReceiptFormErrors, AvailableItemOption } from '../types/receipt-form.types';
import { User } from '../../../types';

export class ReceiptFormValidation {
  
  static validateReceiptForm(
    formData: ReceiptFormData, 
    users: User[], 
    currentUserId: string
  ): ReceiptFormErrors {
    const errors: ReceiptFormErrors = {};

    // Validate user selection
    if (!formData.selectedUserId) {
      errors.selectedUserId = 'יש לבחור משתמש';
    } else if (formData.selectedUserId === currentUserId) {
      errors.selectedUserId = 'לא ניתן לבחור את עצמך';
    } else if (!users.find(u => u.id === formData.selectedUserId)) {
      errors.selectedUserId = 'המשתמש שנבחר לא קיים';
    }

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      errors.items = 'יש לבחור לפחות פריט אחד';
    } else {
      // Validate each item
      for (const item of formData.items) {
        if (item.quantity <= 0) {
          errors.items = 'כמות הפריטים חייבת להיות גדולה מ-0';
          break;
        }
        if (item.requiresReporting && item.quantity > 1) {
          errors.items = 'פריטי צופן מוגבלים לכמות 1 בלבד';
          break;
        }
        if (item.maxAvailable && item.quantity > item.maxAvailable) {
          errors.items = `כמות הפריט "${item.name}" עולה על הזמין (${item.maxAvailable})`;
          break;
        }
      }
    }

    return errors;
  }

  static validateItemAvailability(
    item: AvailableItemOption, 
    requestedQuantity: number,
    usedItems: string[]
  ): string | null {
    // Check if cipher item and already used
    if (item.requiresReporting && usedItems.includes(item.id)) {
      return 'פריט צופן זה כבר נבחר';
    }

    // Check quantity availability
    if (requestedQuantity > item.maxQuantity) {
      return `זמינה כמות מקסימלית של ${item.maxQuantity}`;
    }

    // Check if item is operational and available
    if (!item.isOperational) {
      return 'הפריט אינו פעיל';
    }

    if (!item.isAvailable) {
      return 'הפריט אינו זמין כרגע';
    }

    return null;
  }

  static hasErrors(errors: ReceiptFormErrors): boolean {
    return Object.values(errors).some(error => error !== undefined && error !== '');
  }

  static getFirstError(errors: ReceiptFormErrors): string | null {
    const errorValues = Object.values(errors).filter(error => error !== undefined && error !== '');
    return errorValues.length > 0 ? errorValues[0] : null;
  }

  static validateUserPermissions(isAdmin: boolean, action: 'create' | 'update' | 'delete'): boolean {
    // Only admins can create, update, or delete receipts
    return isAdmin;
  }

  static canUserSignReceipt(receiptSignedById: string, currentUserId: string): boolean {
    // Users can only sign receipts assigned to them
    return receiptSignedById === currentUserId;
  }
}
