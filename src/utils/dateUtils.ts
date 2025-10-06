/**
 * Utility functions for date formatting
 */

/**
 * Formats a timestamp to Hebrew locale date and time string
 * @param timestamp - The timestamp to format
 * @returns Formatted date and time string in Hebrew locale
 */
export const formatDateTimeHebrew = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString('he-IL');
  const timeStr = date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  return `${dateStr} ${timeStr}`;
};