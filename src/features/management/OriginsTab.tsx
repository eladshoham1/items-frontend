import React from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';

export const OriginsTab: React.FC = () => {
  const { 
    origins, 
    loading, 
    error, 
    createOrigin, 
    updateOrigin, 
    deleteOrigins, 
    loadAllData 
  } = useManagement();

  return (
    <ManagementTable
      title="מקור"
      items={origins}
      loading={loading}
      error={error}
      onAdd={async (name) => {
        const result = await createOrigin({ name });
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onEdit={async (id, name) => {
        const result = await updateOrigin(id, { name });
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onDelete={async (ids) => {
        const result = await deleteOrigins({ ids });
        return {
          success: result.success,
          error: result.error,
        };
      }}
      onRefresh={loadAllData}
    />
  );
};
