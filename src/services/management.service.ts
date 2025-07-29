import { apiService } from './api.service';
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

class ManagementService {
  // Unit methods
  async getAllUnits(): Promise<ManagementResponse<UnitEntity[]>> {
    try {
      const response = await apiService.get<UnitEntity[]>('/management/units');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת יחידות',
      };
    }
  }

  async createUnit(data: CreateUnitRequest): Promise<ManagementResponse<UnitEntity>> {
    try {
      const response = await apiService.post<UnitEntity>('/management/units', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת יחידה',
        isConflict,
      };
    }
  }

  async updateUnit(id: string, data: UpdateUnitRequest): Promise<ManagementResponse<UnitEntity>> {
    try {
      const response = await apiService.patch<UnitEntity>(`/management/units/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון יחידה',
        isConflict,
      };
    }
  }

  async deleteUnits(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> {
    try {
      const response = await apiService.delete<{ deleted: number; errors: string[] }>('/management/units', { data });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת יחידות',
      };
    }
  }

  // Location methods
  async getAllLocations(): Promise<ManagementResponse<LocationEntity[]>> {
    try {
      const response = await apiService.get<LocationEntity[]>('/management/locations');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת מיקומים',
      };
    }
  }

  async createLocation(data: CreateLocationRequest): Promise<ManagementResponse<LocationEntity>> {
    try {
      const response = await apiService.post<LocationEntity>('/management/locations', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת מיקום',
        isConflict,
      };
    }
  }

  async updateLocation(id: string, data: UpdateLocationRequest): Promise<ManagementResponse<LocationEntity>> {
    try {
      const response = await apiService.patch<LocationEntity>(`/management/locations/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון מיקום',
        isConflict,
      };
    }
  }

  async deleteLocations(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> {
    try {
      const response = await apiService.delete<{ deleted: number; errors: string[] }>('/management/locations', { data });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת מיקומים',
      };
    }
  }

  // Rank methods
  async getAllRanks(): Promise<ManagementResponse<RankEntity[]>> {
    try {
      const response = await apiService.get<RankEntity[]>('/management/ranks');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת דרגות',
      };
    }
  }

  async createRank(data: CreateRankRequest): Promise<ManagementResponse<RankEntity>> {
    try {
      const response = await apiService.post<RankEntity>('/management/ranks', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת דרגה',
        isConflict,
      };
    }
  }

  async updateRank(id: string, data: UpdateRankRequest): Promise<ManagementResponse<RankEntity>> {
    try {
      const response = await apiService.patch<RankEntity>(`/management/ranks/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון דרגה',
        isConflict,
      };
    }
  }

  async deleteRanks(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> {
    try {
      const response = await apiService.delete<{ deleted: number; errors: string[] }>('/management/ranks', { data });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת דרגות',
      };
    }
  }

  // Origin methods
  async getAllOrigins(): Promise<ManagementResponse<OriginEntity[]>> {
    try {
      const response = await apiService.get<OriginEntity[]>('/management/origins');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת מקורות',
      };
    }
  }

  async createOrigin(data: CreateOriginRequest): Promise<ManagementResponse<OriginEntity>> {
    try {
      const response = await apiService.post<OriginEntity>('/management/origins', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת מקור',
        isConflict,
      };
    }
  }

  async updateOrigin(id: string, data: UpdateOriginRequest): Promise<ManagementResponse<OriginEntity>> {
    try {
      const response = await apiService.patch<OriginEntity>(`/management/origins/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון מקור',
        isConflict,
      };
    }
  }

  async deleteOrigins(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> {
    try {
      const response = await apiService.delete<{ deleted: number; errors: string[] }>('/management/origins', { data });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת מקורות',
      };
    }
  }

  // Item Name methods
  async getAllItemNames(): Promise<ManagementResponse<ItemNameEntity[]>> {
    try {
      const response = await apiService.get<ItemNameEntity[]>('/management/item-names');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת שמות פריטים',
      };
    }
  }

  async createItemName(data: CreateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> {
    try {
      const response = await apiService.post<ItemNameEntity>('/management/item-names', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת שם פריט',
        isConflict,
      };
    }
  }

  async updateItemName(id: string, data: UpdateItemNameRequest): Promise<ManagementResponse<ItemNameEntity>> {
    try {
      const response = await apiService.patch<ItemNameEntity>(`/management/item-names/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון שם פריט',
        isConflict,
      };
    }
  }

  async deleteItemNames(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: number; errors: string[] }>> {
    try {
      const response = await apiService.delete<{ deleted: number; errors: string[] }>('/management/item-names', { data });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת שמות פריטים',
      };
    }
  }
}

export const managementService = new ManagementService();
export default managementService;
