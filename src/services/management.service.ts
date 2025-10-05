import { apiService } from './api.service';
import {
  UnitEntity,
  LocationEntity,
  ItemNameEntity,
  AllocationEntity,
  CreateUnitRequest,
  CreateLocationRequest,
  CreateItemNameRequest,
  CreateAllocationRequest,
  UpdateUnitRequest,
  UpdateLocationRequest,
  UpdateItemNameRequest,
  UpdateAllocationRequest,
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

  // Notification settings methods
  async getNotificationSettings(): Promise<ManagementResponse<{enabled: boolean; dayOfWeek: number}>> {
    try {
      const response = await apiService.get<{enabled: boolean; dayOfWeek: number}>('/management/notification-settings');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת הגדרות התראות',
      };
    }
  }

  async updateNotificationSettings(data: {enabled: boolean; dayOfWeek: number}): Promise<ManagementResponse<{enabled: boolean; dayOfWeek: number}>> {
    try {
      const response = await apiService.patch<{enabled: boolean; dayOfWeek: number}>('/management/notification-settings', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון הגדרות התראות',
      };
    }
  }

  // Allocation methods
  async getAllAllocations(): Promise<ManagementResponse<AllocationEntity[]>> {
    try {
      const response = await apiService.get<AllocationEntity[]>('/management/allocations');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בטעינת שבצ"ק',
      };
    }
  }

  async createAllocation(data: CreateAllocationRequest): Promise<ManagementResponse<AllocationEntity>> {
    try {
      const response = await apiService.post<AllocationEntity>('/management/allocations', data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה ביצירת שבצ"ק',
        isConflict,
      };
    }
  }

  async updateAllocation(id: string, data: UpdateAllocationRequest): Promise<ManagementResponse<AllocationEntity>> {
    try {
      const response = await apiService.patch<AllocationEntity>(`/management/allocations/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה בעדכון שבצ"ק',
        isConflict,
      };
    }
  }

  async deleteAllocations(data: BulkDeleteRequest): Promise<ManagementResponse<{ deleted: boolean; deletedCount: number; message: string }>> {
    try {
      const response = await apiService.delete<{ deleted: boolean; deletedCount: number; message: string }>('/management/allocations', {
        data,
      });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'שגיאה במחיקת שבצ"ק',
      };
    }
  }

  // --- Admin only: Import / Export entire database ---
  async exportDatabase(): Promise<ManagementResponse<any>> {
    try {
      // Use no timeout for export operations as they can take a long time with large datasets
      const response = await apiService.get<any>('/backup/export', { timeout: 0 });
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
      // Use no timeout for import operations as they can take a very long time
      const response = await apiService.post<any>('/backup/import', requestBody, { timeout: 0 });
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
      const requestBody = { isOverride: override, data: payload };
      const response = await apiService.post<any>(
        `/backup/import`,
        requestBody,
        { timeout: 0 }
      );

      // Enhanced ID extraction with better logging
      console.log('Import response:', response);
      
      // Check if this is a direct import result (synchronous) vs async process start
      const hasImportResultStructure = response && typeof response === 'object' && 
        (response.allocation || response.itemName || response.location || response.receipt);
      
      if (hasImportResultStructure) {
        console.log('Server returned direct import results (synchronous import)');
        // Generate a fake ID for compatibility with the polling logic
        const fakeId = `sync-${Date.now()}`;
        
        // Store the result for immediate retrieval in getImportStatus
        (window as any).__tempImportResult = {
          id: fakeId,
          result: response,
          status: 'completed',
          done: true,
          progress: 100
        };
        
        console.log('Generated fake ID for synchronous import:', fakeId);
        return { success: true, data: { id: fakeId } };
      }
      
      // Try normal async ID extraction for async imports
      const extractIdFromNestedResponse = (obj: any, path: string = ''): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Check direct ID fields
        for (const idField of ['id', 'operationId', 'processId', 'importId']) {
          if (obj[idField]) {
            console.log(`Found ID "${obj[idField]}" at path: ${path}.${idField}`);
            return String(obj[idField]);
          }
        }
        
        // Recursively search in nested objects (up to 3 levels deep)
        if (path.split('.').length < 3) {
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const nestedId = extractIdFromNestedResponse(obj[key], path ? `${path}.${key}` : key);
              if (nestedId) return nestedId;
            }
          }
        }
        
        return null;
      };

      const id = extractIdFromNestedResponse(response);

      if (id) {
        console.log('Successfully extracted import ID:', id);
        return { success: true, data: { id } };
      }

      // Log the full response for debugging
      console.error('No ID found in import response:', JSON.stringify(response, null, 2));
      return { 
        success: false, 
        error: `שגיאה בתחילת ייבוא: מזהה תהליך לא התקבל. Response: ${JSON.stringify(response)}` 
      };
    } catch (error: any) {
      console.error('Import start error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'שגיאה בתחילת ייבוא' 
      };
    }
  }

  async getImportStatus(id: string): Promise<ManagementResponse<{ progress: number; done?: boolean; tables?: any[]; totalStatistics?: any; message?: string; status?: string; result?: any }>> {
    try {
      // Check if this is a synchronous import with stored results
      if (id.startsWith('sync-')) {
        const tempResult = (window as any).__tempImportResult;
        if (tempResult && tempResult.id === id) {
          console.log('Returning stored synchronous import result');
          // Clear the temp result after first retrieval
          delete (window as any).__tempImportResult;
          return { 
            success: true, 
            data: { 
              progress: tempResult.progress,
              done: tempResult.done,
              status: tempResult.status,
              result: tempResult.result,
              message: 'ייבוא הושלם בהצלחה',
              tables: [],
              totalStatistics: {}
            } 
          };
        }
      }
      
      // Normal async import status check
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
