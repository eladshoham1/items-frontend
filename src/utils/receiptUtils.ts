import { Receipt } from '../types';

/**
 * Shared helper functions for receipt operations
 */

/**
 * Safely get unit name (prefer receiver unit, fallback to issuer)
 */
export const getReceiptUnit = (receipt: Receipt): string => {
  return receipt.signedBy?.location?.unit?.name || receipt.createdBy?.location?.unit?.name || '—';
};

/**
 * Safely get location name (prefer receiver location, fallback to issuer)
 */
export const getReceiptLocation = (receipt: Receipt): string => {
  return receipt.signedBy?.location?.name || receipt.createdBy?.location?.name || '—';
};

/**
 * Check if receipt items match a search term
 */
export const receiptItemsMatchSearch = (receipt: Receipt, searchTerm: string): boolean => {
  return receipt.receiptItems?.some(receiptItem => {
    const itemName = (receiptItem.item?.itemName?.name?.toLowerCase() || '').normalize('NFC');
    const itemId = (receiptItem.item?.idNumber?.toLowerCase() || '').normalize('NFC');
    return itemName.includes(searchTerm) || itemId.includes(searchTerm);
  }) || false;
};

/**
 * Generic sort comparison function for receipt fields
 */
export const compareReceiptValues = (aVal: any, bVal: any, direction: 'asc' | 'desc'): number => {
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    const cmp = aVal.localeCompare(bVal, 'he');
    return direction === 'asc' ? cmp : -cmp;
  }
  if (aVal < bVal) return direction === 'asc' ? -1 : 1;
  if (aVal > bVal) return direction === 'asc' ? 1 : -1;
  return 0;
};