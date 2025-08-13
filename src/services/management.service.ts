import { apiService } from './api.service';
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

  // Settings methods
  async getSettings(): Promise<ManagementResponse<{emailNotificationsEnabled: boolean}>> {
    try {
      const response = await apiService.get<{emailNotificationsEnabled: boolean}>('/management/settings');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת הגדרות',
      };
    }
  }

  async updateSettings(data: {emailNotificationsEnabled: boolean}): Promise<ManagementResponse<{emailNotificationsEnabled: boolean}>> {
    try {
      const response = await apiService.patch<{emailNotificationsEnabled: boolean}>('/management/settings', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון הגדרות',
      };
    }
  }

  // --- Admin only: Import / Export entire database ---
  async exportDatabase(): Promise<ManagementResponse<any>> {
    try {
      const response = await apiService.get<any>('/backup/export');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בייצוא נתונים',
      };
    }
  }

  // New async export starter: returns process id immediately
  async startExport(): Promise<ManagementResponse<{ id: string }>> {
    try {
      // Server starts export on GET /backup/export and returns an OperationStatus with id
      const response = await apiService.get<{ id?: string; operationId?: string; processId?: string; [k: string]: any }>(
        '/backup/export'
      );
      const id =
        (response as any)?.operationId ||
        (response as any)?.id ||
        (response as any)?.processId ||
        (response as any)?.data?.operationId ||
        (response as any)?.data?.id ||
        (response as any)?.data?.processId;
      if (id) return { success: true, data: { id } };
      return { success: false, error: 'שגיאה בתחילת ייצוא: מזהה תהליך לא התקבל' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'שגיאה בתחילת ייצוא' };
    }
  }

  async getExportStatus(id: string): Promise<ManagementResponse<{ progress: number; downloadUrl?: string; done?: boolean; result?: any; tables?: any[]; totalStatistics?: any; message?: string; status?: string }>> {
    try {
      const raw = await apiService.get<any>(`/backup/export/status/${id}`);
      const nested = raw?.result?.currentProgress || {};
      const progress =
        typeof raw?.progress === 'number'
          ? raw.progress
          : typeof nested?.overallProgress === 'number'
          ? nested.overallProgress
          : 0;
      const status = raw?.status || nested?.status;
      const done = status === 'completed' || raw?.done === true;
      const downloadUrl = raw?.result?.downloadUrl || raw?.downloadUrl;
      const result = raw?.result;
      const tables = raw?.tables ?? nested?.tables ?? [];
      const totalStatistics = raw?.totalStatistics ?? nested?.totalStatistics;
      const message = raw?.message || raw?.result?.message;
      return { success: true, data: { progress, downloadUrl, done, result, tables, totalStatistics, message, status } };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'שגיאה בשליפת סטטוס ייצוא' };
    }
  }

  async importDatabase(payload: any, override: boolean = false): Promise<ManagementResponse<any>> {
    try {
      const requestBody = { data: payload, isOverride: override };
      const response = await apiService.post<any>('/backup/import', requestBody);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בייבוא נתונים',
      };
    }
  }

  // New async import starter: returns process id immediately
  async startImport(payload: any, override: boolean = false): Promise<ManagementResponse<{ id: string }>> {
    try {
      // Server starts import on POST /backup/import and returns an OperationStatus with id
      const requestBody = { override, ...payload };
      const response = await apiService.post<{ id?: string; processId?: string; operationId?: string; data?: any }>(
        `/backup/import`,
        requestBody,
        { timeout: 0 }
      );
      const id =
        (response as any)?.operationId ||
        (response as any)?.id ||
        (response as any)?.processId ||
        (response as any)?.data?.operationId ||
        (response as any)?.data?.id ||
        (response as any)?.data?.processId;
      if (id) return { success: true, data: { id } };
      return { success: false, error: 'שגיאה בתחילת ייבוא: מזהה תהליך לא התקבל' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'שגיאה בתחילת ייבוא' };
    }
  }

  async getImportStatus(id: string): Promise<ManagementResponse<{ progress: number; done?: boolean; tables?: any[]; totalStatistics?: any; message?: string; status?: string; result?: any }>> {
    try {
      const raw = await apiService.get<any>(`/backup/import/status/${id}`);
      const nested = raw?.result?.currentProgress || {};
      const progress =
        typeof raw?.progress === 'number'
          ? raw.progress
          : typeof nested?.overallProgress === 'number'
          ? nested.overallProgress
          : 0;
      const status = raw?.status || nested?.status;
      const done = status === 'completed' || raw?.done === true;
      const tables = raw?.tables ?? nested?.tables ?? [];
      const totalStatistics = raw?.totalStatistics ?? nested?.totalStatistics;
      const message = raw?.message || raw?.result?.message;
      const result = raw?.result;
      return { success: true, data: { progress, done, tables, totalStatistics, message, status, result } };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'שגיאה בשליפת סטטוס ייבוא' };
    }
  }
}

export const managementService = new ManagementService();
export default managementService;
