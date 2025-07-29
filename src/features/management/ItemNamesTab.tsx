import React from 'react';
import { ManagementTable } from './ManagementTable';
import { useManagement } from '../../contexts';

export const ItemNamesTab: React.FC = () => {
  const { 
    itemNames, 
    loading, 
    error, 
    createItemName, 
    updateItemName, 
    deleteItemNames, 
    loadAllData 
  } = useManagement();

  return (
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
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onDelete={async (ids) => {
        const result = await deleteItemNames({ ids });
        return {
          success: result.success,
          error: result.error,
        };
      }}
      onRefresh={loadAllData}
    />
  );
};
