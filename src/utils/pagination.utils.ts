import { UI_CONFIG } from '../config/app.config';

export const paginate = <T>(
  items: T[],
  currentPage: number,
  pageSize: number = UI_CONFIG.TABLE_PAGE_SIZE
): {
  paginatedItems: T[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
} => {
  // Safety check: ensure items is a valid array
  if (!items || !Array.isArray(items)) {
    return {
      paginatedItems: [],
      totalPages: 0,
      startIndex: 0,
      endIndex: 0,
    };
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    paginatedItems,
    totalPages,
    startIndex,
    endIndex,
  };
};

export const generatePageNumbers = (currentPage: number, totalPages: number): number[] => {
  const pages: number[] = [];
  
  // If total pages is small, show all
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  // Always include current page
  pages.push(currentPage);
  
  // Add pages around current page
  const delta = 2; // Number of pages to show on each side of current page
  
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  
  // Sort pages
  pages.sort((a, b) => a - b);
  
  return pages;
};
