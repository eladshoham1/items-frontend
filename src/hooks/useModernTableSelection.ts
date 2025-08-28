import { useState, useCallback, useEffect } from 'react';

export interface UseModernTableSelectionOptions {
  items: Array<{ id: string }>;
  onSelectionChange?: (selectedIds: string[]) => void;
  multiSelect?: boolean;
  maxSelection?: number;
}

export const useModernTableSelection = ({
  items,
  onSelectionChange,
  multiSelect = true,
  maxSelection
}: UseModernTableSelectionOptions) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number>(-1);

  // Clear selection when items change significantly
  useEffect(() => {
    const validIds = selectedIds.filter(id => items.some(item => item.id === id));
    if (validIds.length !== selectedIds.length) {
      setSelectedIds(validIds);
    }
  }, [items, selectedIds]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((
    id: string, 
    event?: React.MouseEvent,
    itemIndex?: number
  ) => {
    setSelectedIds(prev => {
      const isCurrentlySelected = prev.includes(id);
      
      // Single select mode
      if (!multiSelect) {
        return isCurrentlySelected ? [] : [id];
      }

      // Multi-select with keyboard modifiers
      if (event) {
        const { ctrlKey, metaKey, shiftKey } = event;
        
        // Ctrl/Cmd + click: toggle individual item
        if (ctrlKey || metaKey) {
          if (isCurrentlySelected) {
            return prev.filter(selectedId => selectedId !== id);
          } else {
            // Check max selection limit
            if (maxSelection && prev.length >= maxSelection) {
              return prev;
            }
            return [...prev, id];
          }
        }
        
        // Shift + click: range selection
        if (shiftKey && lastClickedIndex !== -1 && itemIndex !== undefined) {
          const startIndex = Math.min(lastClickedIndex, itemIndex);
          const endIndex = Math.max(lastClickedIndex, itemIndex);
          const rangeIds = items
            .slice(startIndex, endIndex + 1)
            .map(item => item.id);
          
          // Merge with existing selection
          const newSelection = Array.from(new Set([...prev, ...rangeIds]));
          
          // Check max selection limit
          if (maxSelection && newSelection.length > maxSelection) {
            return prev;
          }
          
          return newSelection;
        }
      }
      
      // Regular click: toggle single item or clear if already selected
      if (isCurrentlySelected) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        // Check max selection limit
        if (maxSelection && prev.length >= maxSelection) {
          return prev;
        }
        return [...prev, id];
      }
    });

    // Update last clicked index for range selection
    if (itemIndex !== undefined) {
      setLastClickedIndex(itemIndex);
    }
  }, [multiSelect, maxSelection, lastClickedIndex, items]);

  const selectAll = useCallback(() => {
    if (!multiSelect) return;
    
    const allIds = items.map(item => item.id);
    
    // Check max selection limit
    if (maxSelection && allIds.length > maxSelection) {
      setSelectedIds(allIds.slice(0, maxSelection));
    } else {
      setSelectedIds(allIds);
    }
  }, [items, multiSelect, maxSelection]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setLastClickedIndex(-1);
  }, []);

  const selectRange = useCallback((startIndex: number, endIndex: number) => {
    if (!multiSelect) return;
    
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const rangeIds = items.slice(start, end + 1).map(item => item.id);
    
    // Check max selection limit
    if (maxSelection && rangeIds.length > maxSelection) {
      setSelectedIds(rangeIds.slice(0, maxSelection));
    } else {
      setSelectedIds(rangeIds);
    }
  }, [items, multiSelect, maxSelection]);

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === items.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;
  const hasSelection = selectedIds.length > 0;

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    isAllSelected,
    isPartiallySelected,
    hasSelection,
    selectedCount: selectedIds.length,
    totalCount: items.length
  };
};
