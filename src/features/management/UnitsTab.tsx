import React from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';

export const UnitsTab: React.FC = () => {
  const { 
    units, 
    loading, 
    error, 
    createUnit, 
    updateUnit, 
    deleteUnits, 
    loadAllData 
  } = useManagement();

  return (
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
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onDelete={async (ids) => {
        const result = await deleteUnits({ ids });
        return {
          success: result.success,
          error: result.error,
        };
      }}
      onRefresh={loadAllData}
    />
  );
};
