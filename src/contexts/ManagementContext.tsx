import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { managementService } from '../services';
import {
  UnitEntity,
  LocationEntity,
  ItemNameEntity,
  CreateUnitRequest,
  CreateLocationRequest,
  CreateItemNameRequest,
  UpdateUnitRequest,
  UpdateLocationRequest,
  UpdateItemNameRequest,
  BulkDeleteRequest,
  ManagementResponse,
} from '../types';

interface ManagementContextType {
  // Data
  units: UnitEntity[];
  locations: LocationEntity[];
  itemNames: ItemNameEntity[];
  loading: boolean;
  error: string | null;
  // Methods
  loadAllData: () => Promise<void>;
  loadUnits: () => Promise<void>;
  loadLocations: () => Promise<void>;
  loadItemNames: () => Promise<void>;
  // Unit operations
  createUnit: (data: CreateUnitRequest) => Promise<ManagementResponse<UnitEntity>>;
  updateUnit: (id: string, data: UpdateUnitRequest) => Promise<ManagementResponse<UnitEntity>>;
  deleteUnits: (data: BulkDeleteRequest) => Promise<ManagementResponse<{ deleted: number; errors: string[] }>>;
  // Location operations
  createLocation: (data: CreateLocationRequest) => Promise<ManagementResponse<LocationEntity>>;
  updateLocation: (id: string, data: UpdateLocationRequest) => Promise<ManagementResponse<LocationEntity>>;
  deleteLocations: (data: BulkDeleteRequest) => Promise<ManagementResponse<{ deleted: number; errors: string[] }>>;
  // Item Name operations
  createItemName: (data: CreateItemNameRequest) => Promise<ManagementResponse<ItemNameEntity>>;
  updateItemName: (id: string, data: UpdateItemNameRequest) => Promise<ManagementResponse<ItemNameEntity>>;
  deleteItemNames: (data: BulkDeleteRequest) => Promise<ManagementResponse<{ deleted: number; errors: string[] }>>;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

interface ManagementProviderProps {
  children: ReactNode;
}

export const ManagementProvider: React.FC<ManagementProviderProps> = ({ children }) => {
  const [units, setUnits] = useState<UnitEntity[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [itemNames, setItemNames] = useState<ItemNameEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy loaders per collection
  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managementService.getAllUnits();
      if (res.success && res.data) setUnits(res.data);
      else if (!res.success) setError(res.error || 'שגיאה בטעינת יחידות');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managementService.getAllLocations();
      if (res.success && res.data) setLocations(res.data);
      else if (!res.success) setError(res.error || 'שגיאה בטעינת מיקומים');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadItemNames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managementService.getAllItemNames();
      if (res.success && res.data) setItemNames(res.data);
      else if (!res.success) setError(res.error || 'שגיאה בטעינת שמות פריטים');
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep an aggregate loader for scenarios that need all data (e.g., export/import screens)
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitsRes, locationsRes, itemNamesRes] = await Promise.all([
        managementService.getAllUnits(),
        managementService.getAllLocations(),
        managementService.getAllItemNames(),
      ]);

      if (unitsRes.success && unitsRes.data) setUnits(unitsRes.data);
      if (locationsRes.success && locationsRes.data) setLocations(locationsRes.data);
      if (itemNamesRes.success && itemNamesRes.data) setItemNames(itemNamesRes.data);

      if (!unitsRes.success) setError(unitsRes.error || null);
      if (!locationsRes.success) setError(prev => prev || locationsRes.error || null);
      if (!itemNamesRes.success) setError(prev => prev || itemNamesRes.error || null);
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  // IMPORTANT: Do NOT auto-load on app start anymore. Fetch only when tabs mount.
  // useEffect(() => {
  //   loadAllData();
  // }, [loadAllData]);

  // Unit operations
  const createUnit = useCallback(async (data: CreateUnitRequest): Promise<ManagementResponse<UnitEntity>> => {
    const result = await managementService.createUnit(data);
    if (result.success && result.data) {
      setUnits(prev => [...prev, result.data!]);
    }
    return result;
  }, []);

  const updateUnit = useCallback(async (id: string, data: UpdateUnitRequest): Promise<ManagementResponse<UnitEntity>> => {
    const result = await managementService.updateUnit(id, data);
    if (result.success && result.data) {
      setUnits(prev => prev.map(unit => unit.id === id ? result.data! : unit));
    }
    return result;
  }, []);

  const deleteUnits = useCallback(async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteUnits(data);
    if (result.success) {
      setUnits(prev => prev.filter(unit => !data.ids.includes(unit.id)));
    }
    return result;
  }, []);

  // Location operations
  const createLocation = useCallback(async (data: CreateLocationRequest): Promise<ManagementResponse<LocationEntity>> => {
    const result = await managementService.createLocation(data);
    if (result.success && result.data) {
      setLocations(prev => [...prev, result.data!]);
    }
    return result;
  }, []);

  const updateLocation = useCallback(async (id: string, data: UpdateLocationRequest): Promise<ManagementResponse<LocationEntity>> => {
    const result = await managementService.updateLocation(id, data);
    if (result.success && result.data) {
      setLocations(prev => prev.map(location => location.id === id ? result.data! : location));
    }
    return result;
  }, []);

  const deleteLocations = useCallback(async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteLocations(data);
    if (result.success) {
      setLocations(prev => prev.filter(location => !data.ids.includes(location.id)));
    }
    return result;
  }, []);

  // Item Name operations
  const createItemName = useCallback(async (data: CreateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> => {
    const result = await managementService.createItemName(data);
    if (result.success && result.data) {
      setItemNames(prev => [...prev, result.data!]);
    }
    return result;
  }, []);

  const updateItemName = useCallback(async (id: string, data: UpdateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> => {
    const result = await managementService.updateItemName(id, data);
    if (result.success && result.data) {
      setItemNames(prev => prev.map(itemName => itemName.id === id ? result.data! : itemName));
    }
    return result;
  }, []);

  const deleteItemNames = useCallback(async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteItemNames(data);
    if (result.success) {
      setItemNames(prev => prev.filter(itemName => !data.ids.includes(itemName.id)));
    }
    return result;
  }, []);

  const value: ManagementContextType = {
    // Data
    units,
    locations,
    itemNames,
    loading,
    error,
    // Methods
    loadAllData,
    loadUnits,
    loadLocations,
    loadItemNames,
    // Unit operations
    createUnit,
    updateUnit,
    deleteUnits,
    // Location operations
    createLocation,
    updateLocation,
    deleteLocations,
    // Item Name operations
    createItemName,
    updateItemName,
    deleteItemNames,
  };

  return (
    <ManagementContext.Provider value={value}>
      {children}
    </ManagementContext.Provider>
  );
};

export const useManagement = (): ManagementContextType => {
  const context = useContext(ManagementContext);
  if (context === undefined) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
};
