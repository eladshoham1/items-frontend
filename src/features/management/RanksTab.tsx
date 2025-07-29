import React from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';

export const RanksTab: React.FC = () => {
  const { 
    ranks, 
    loading, 
    error, 
    createRank, 
    updateRank, 
    deleteRanks, 
    loadAllData 
  } = useManagement();

  return (
    <ManagementTable
      title="דרגה"
      items={ranks}
      loading={loading}
      error={error}
      onAdd={async (name) => {
        const result = await createRank({ name });
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onEdit={async (id, name) => {
        const result = await updateRank(id, { name });
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onDelete={async (ids) => {
        const result = await deleteRanks({ ids });
        return {
          success: result.success,
          error: result.error,
        };
      }}
      onRefresh={loadAllData}
    />
  );
};
