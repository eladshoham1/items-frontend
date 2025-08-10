import React, { useEffect, useState } from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';
import { BulkDeleteErrorModal } from '../../shared/components';

export const UnitsTab: React.FC = () => {
  const { 
    units, 
    loading, 
    error, 
    createUnit, 
    updateUnit, 
    deleteUnits, 
    loadUnits 
  } = useManagement();

  const [bulkDeleteError, setBulkDeleteError] = useState({
    isOpen: false,
    message: '',
    deletedCount: 0,
    totalCount: 0,
    errors: [] as string[],
  });

  // Lazy load units on first mount/open
  useEffect(() => {
    if (!units || units.length === 0) {
      loadUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ManagementTable
        title="יחידה"
        items={units}
        loading={loading}
        error={error}
        onAdd={async (name) => {
          const result = await createUnit({ name });
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onEdit={async (id, name) => {
          const result = await updateUnit(id, { name });
          if (result.success) {
            await loadUnits();
          }
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onDelete={async (ids) => {
          const result = await deleteUnits({ ids });
          const deletedCount = (result as any)?.data?.deleted ?? 0;
          const errors: string[] = (result as any)?.data?.errors ?? [];

          if (result.success) {
            // Always refetch to reflect server truth (even on partial delete)
            await loadUnits();
          }

          if (result.success && (deletedCount < ids.length || errors.length > 0)) {
            // Show modal with server-provided details, but suppress outer alert
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'חלק מהיחידות לא נמחקו עקב שיוך משתמשים למיקומים ביחידה.',
              deletedCount,
              totalCount: ids.length,
              errors,
            });
            return { success: true };
          }

          if (!result.success) {
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'שגיאה במחיקת יחידות',
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
        onRefresh={() => { loadUnits(); }}
      />

      <BulkDeleteErrorModal
        isOpen={bulkDeleteError.isOpen}
        onClose={() => setBulkDeleteError({ isOpen: false, message: '', deletedCount: 0, totalCount: 0, errors: [] })}
        title="תוצאות מחיקה מרובה - יחידות"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="unit"
      />
    </>
  );
};
