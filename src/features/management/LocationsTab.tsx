import React from 'react';
import { LocationsTable } from './LocationsTable';
import { useManagement } from '../../contexts';

export const LocationsTab: React.FC = () => {
  const { 
    locations, 
    units,
    loading, 
    error, 
    createLocation, 
    updateLocation, 
    deleteLocations, 
    loadAllData 
  } = useManagement();

  return (
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
        return {
          success: result.success,
          error: result.error,
          isConflict: result.isConflict,
        };
      }}
      onDelete={async (ids) => {
        const result = await deleteLocations({ ids });
        return {
          success: result.success,
          error: result.error,
        };
      }}
      onRefresh={loadAllData}
    />
  );
};
