import React, { useEffect, useState } from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';
import { BulkDeleteErrorModal } from '../../shared/components';

export const ItemNamesTab: React.FC = () => {
  const { 
    itemNames, 
    loading, 
    error, 
    createItemName, 
    updateItemName, 
    deleteItemNames, 
    loadItemNames 
  } = useManagement();

  const [bulkDeleteError, setBulkDeleteError] = useState({
    isOpen: false,
    message: '',
    deletedCount: 0,
    totalCount: 0,
    errors: [] as string[],
  });

  useEffect(() => {
    if (!itemNames || itemNames.length === 0) {
      loadItemNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ManagementTable
        title="שם פריט"
        items={itemNames}
        loading={loading}
        error={error}
        onAdd={async (name) => {
          const result = await createItemName({ name });
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onEdit={async (id, name) => {
          const result = await updateItemName(id, { name });
          if (result.success) {
            await loadItemNames();
          }
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onDelete={async (ids) => {
          const result = await deleteItemNames({ ids });
          const deletedCount = (result as any)?.data?.deleted ?? (result as any)?.data?.deletedCount ?? 0;
          const errors: string[] = (result as any)?.data?.errors ?? [];

          if (result.success) {
            // Always refetch to reflect server truth
            await loadItemNames();
          }

          if (result.success && (deletedCount < ids.length || errors.length > 0)) {
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'חלק משמות הפריטים לא נמחקו עקב תלות בפריטים קיימים.',
              deletedCount,
              totalCount: ids.length,
              errors,
            });
            // Suppress generic alert in table
            return { success: true };
          }

          if (!result.success) {
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'שגיאה במחיקת שמות פריטים',
              deletedCount,
              totalCount: ids.length,
              errors,
            });
          }

          return {
            success: result.success,
            error: result.error,
          };
        }}
        onRefresh={() => { loadItemNames(); }}
      />

      <BulkDeleteErrorModal
        isOpen={bulkDeleteError.isOpen}
        onClose={() => setBulkDeleteError({ isOpen: false, message: '', deletedCount: 0, totalCount: 0, errors: [] })}
        title="תוצאות מחיקה מרובה - שמות פריטים"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="itemName"
      />
    </>
  );
};
