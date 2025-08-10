import React, { useEffect, useState } from 'react';
import { LocationsTable } from './LocationsTable';
import { useManagement } from '../../contexts';
import { BulkDeleteErrorModal } from '../../shared/components';

export const LocationsTab: React.FC = () => {
  const { 
    locations, 
    units,
    loading, 
    error, 
    createLocation, 
    updateLocation, 
    deleteLocations, 
    loadLocations,
    loadUnits,
  } = useManagement();

  const [bulkDeleteError, setBulkDeleteError] = useState({
    isOpen: false,
    message: '',
    deletedCount: 0,
    totalCount: 0,
    errors: [] as string[],
  });

  // Lazy load locations & units for selector
  useEffect(() => {
    if (!locations || locations.length === 0) {
      loadLocations();
    }
    if (!units || units.length === 0) {
      loadUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <LocationsTable
        locations={locations}
        units={units}
        loading={loading}
        error={error}
        onAdd={async (data) => {
          const result = await createLocation(data);
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onEdit={async (id, data) => {
          const result = await updateLocation(id, data);
          if (result.success) {
            await loadLocations();
          }
          return {
            success: result.success,
            error: result.error,
            isConflict: result.isConflict,
          };
        }}
        onDelete={async (ids) => {
          const result = await deleteLocations({ ids });
          const deletedCount = (result as any)?.data?.deleted ?? 0;
          const errors: string[] = (result as any)?.data?.errors ?? [];

          if (result.success) {
            await loadLocations();
          }

          if (result.success && (deletedCount < ids.length || errors.length > 0)) {
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'חלק מהמיקומים לא נמחקו עקב שיוך משתמשים למיקום.',
              deletedCount,
              totalCount: ids.length,
              errors,
            });
            // suppress outer alert
            return { success: true };
          }

          if (!result.success) {
            setBulkDeleteError({
              isOpen: true,
              message: result.error || 'שגיאה במחיקת מיקומים',
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
        onRefresh={() => { loadLocations(); }}
      />

      <BulkDeleteErrorModal
        isOpen={bulkDeleteError.isOpen}
        onClose={() => setBulkDeleteError({ isOpen: false, message: '', deletedCount: 0, totalCount: 0, errors: [] })}
        title="תוצאות מחיקה מרובה - מיקומים"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="location"
      />
    </>
  );
};
