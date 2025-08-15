import { User, Item } from '../../../types';

export interface ReceiptFormItem {
  id: string;
  name: string;
  idNumber?: string;
  requiresReporting: boolean; // צופן items
  quantity: number;
  allocatedLocation?: {
    id: string;
    name: string;
    unit?: { name: string };
  };
  maxAvailable?: number;
}

export interface ReceiptFormData {
  selectedUserId: string;
  items: ReceiptFormItem[];
}

export interface AvailableItemOption extends Item {
  displayName: string; // Item name + location + cipher status
  isAvailable: boolean;
  maxQuantity: number;
}

export interface ReceiptFormErrors {
  selectedUserId?: string;
  items?: string;
  general?: string;
}

export interface ReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  originalReceipt?: any; // Receipt type from backend
  isAdmin: boolean;
  currentUser: User;
}

export interface ItemSelectorProps {
  availableItems: AvailableItemOption[];
  selectedItems: ReceiptFormItem[];
  onAddItem: (item: AvailableItemOption, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  loading?: boolean;
  error?: string;
}

export interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  currentUserId: string; // To exclude admin from selection
  error?: string;
}

export interface ReceiptFormSubmitData {
  signedById: string;
  items: string[]; // Array of item IDs for backend
}
