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
  const delta = 2; // Number of pages to show on each side of current page

  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    pages.push(i);
  }

  return pages;
};
