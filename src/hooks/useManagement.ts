import { useState, useEffect, useCallback } from 'react';
import { managementService } from '../services';
import {
  UnitEntity,
  LocationEntity,
  RankEntity,
  OriginEntity,
  ItemNameEntity,
  CreateUnitRequest,
  CreateLocationRequest,
  CreateRankRequest,
  CreateOriginRequest,
  CreateItemNameRequest,
  UpdateUnitRequest,
  UpdateLocationRequest,
  UpdateRankRequest,
  UpdateOriginRequest,
  UpdateItemNameRequest,
  BulkDeleteRequest,
  ManagementResponse,
} from '../types';

export const useManagement = () => {
  const [units, setUnits] = useState<UnitEntity[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [ranks, setRanks] = useState<RankEntity[]>([]);
  const [origins, setOrigins] = useState<OriginEntity[]>([]);
  const [itemNames, setItemNames] = useState<ItemNameEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitsRes, locationsRes, ranksRes, originsRes, itemNamesRes] = await Promise.all([
        managementService.getAllUnits(),
        managementService.getAllLocations(),
        managementService.getAllRanks(),
        managementService.getAllOrigins(),
        managementService.getAllItemNames(),
      ]);

      if (unitsRes.success && unitsRes.data) setUnits(unitsRes.data);
      if (locationsRes.success && locationsRes.data) setLocations(locationsRes.data);
      if (ranksRes.success && ranksRes.data) setRanks(ranksRes.data);
      if (originsRes.success && originsRes.data) setOrigins(originsRes.data);
      if (itemNamesRes.success && itemNamesRes.data) setItemNames(itemNamesRes.data);
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  // Unit operations
  const createUnit = async (data: CreateUnitRequest): Promise<ManagementResponse<UnitEntity>> => {
    const result = await managementService.createUnit(data);
    if (result.success && result.data) {
      setUnits(prev => [...prev, result.data!]);
    }
    return result;
  };

  const updateUnit = async (id: string, data: UpdateUnitRequest): Promise<ManagementResponse<UnitEntity>> => {
    const result = await managementService.updateUnit(id, data);
    if (result.success && result.data) {
      setUnits(prev => prev.map(unit => unit.id === id ? result.data! : unit));
    }
    return result;
  };

  const deleteUnits = async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteUnits(data);
    if (result.success) {
      setUnits(prev => prev.filter(unit => !data.ids.includes(unit.id)));
    }
    return result;
  };

  // Location operations
  const createLocation = async (data: CreateLocationRequest): Promise<ManagementResponse<LocationEntity>> => {
    const result = await managementService.createLocation(data);
    if (result.success && result.data) {
      setLocations(prev => [...prev, result.data!]);
    }
    return result;
  };

  const updateLocation = async (id: string, data: UpdateLocationRequest): Promise<ManagementResponse<LocationEntity>> => {
    const result = await managementService.updateLocation(id, data);
    if (result.success && result.data) {
      setLocations(prev => prev.map(location => location.id === id ? result.data! : location));
    }
    return result;
  };

  const deleteLocations = async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteLocations(data);
    if (result.success) {
      setLocations(prev => prev.filter(location => !data.ids.includes(location.id)));
    }
    return result;
  };

  // Rank operations
  const createRank = async (data: CreateRankRequest): Promise<ManagementResponse<RankEntity>> => {
    const result = await managementService.createRank(data);
    if (result.success && result.data) {
      setRanks(prev => [...prev, result.data!]);
    }
    return result;
  };

  const updateRank = async (id: string, data: UpdateRankRequest): Promise<ManagementResponse<RankEntity>> => {
    const result = await managementService.updateRank(id, data);
    if (result.success && result.data) {
      setRanks(prev => prev.map(rank => rank.id === id ? result.data! : rank));
    }
    return result;
  };

  const deleteRanks = async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteRanks(data);
    if (result.success) {
      setRanks(prev => prev.filter(rank => !data.ids.includes(rank.id)));
    }
    return result;
  };

  // Origin operations
  const createOrigin = async (data: CreateOriginRequest): Promise<ManagementResponse<OriginEntity>> => {
    const result = await managementService.createOrigin(data);
    if (result.success && result.data) {
      setOrigins(prev => [...prev, result.data!]);
    }
    return result;
  };

  const updateOrigin = async (id: string, data: UpdateOriginRequest): Promise<ManagementResponse<OriginEntity>> => {
    const result = await managementService.updateOrigin(id, data);
    if (result.success && result.data) {
      setOrigins(prev => prev.map(origin => origin.id === id ? result.data! : origin));
    }
    return result;
  };

  const deleteOrigins = async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteOrigins(data);
    if (result.success) {
      setOrigins(prev => prev.filter(origin => !data.ids.includes(origin.id)));
    }
    return result;
  };

  // Item Name operations
  const createItemName = async (data: CreateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> => {
    const result = await managementService.createItemName(data);
    if (result.success && result.data) {
      setItemNames(prev => [...prev, result.data!]);
    }
    return result;
  };

  const updateItemName = async (id: string, data: UpdateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> => {
    const result = await managementService.updateItemName(id, data);
    if (result.success && result.data) {
      setItemNames(prev => prev.map(itemName => itemName.id === id ? result.data! : itemName));
    }
    return result;
  };

  const deleteItemNames = async (data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> => {
    const result = await managementService.deleteItemNames(data);
    if (result.success) {
      setItemNames(prev => prev.filter(itemName => !data.ids.includes(itemName.id)));
    }
    return result;
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Data
    units,
    locations,
    ranks,
    origins,
    itemNames,
    loading,
    error,
    // Actions
    loadAllData,
    // Unit operations
    createUnit,
    updateUnit,
    deleteUnits,
    // Location operations
    createLocation,
    updateLocation,
    deleteLocations,
    // Rank operations
    createRank,
    updateRank,
    deleteRanks,
    // Origin operations
    createOrigin,
    updateOrigin,
    deleteOrigins,
    // Item Name operations
    createItemName,
    updateItemName,
    deleteItemNames,
  };
};
