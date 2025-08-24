export interface UnitEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationEntity {
  id: string;
  name: string;
  unitId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RankEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OriginEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemNameEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationEntity {
  id: string;
  unit: string;
  secondaryUnit: string;
  owner: string;
  vehicleType: string | null;
  idNumber: string | null;
  standard: string;
  isIssued: boolean;
  form624: string | null;
  is624Issued: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// Create DTOs
export interface CreateUnitRequest {
  name: string;
}

export interface CreateLocationRequest {
  name: string;
  unitId: string;
}

export interface CreateRankRequest {
  name: string;
}

export interface CreateOriginRequest {
  name: string;
}

export interface CreateItemNameRequest {
  name: string;
}

export interface CreateAllocationRequest {
  unit: string;
  secondaryUnit: string;
  owner: string;
  vehicleType?: string | null;
  idNumber?: string | null;
  standard: string;
  isIssued?: boolean;
  form624?: string | null;
  is624Issued?: boolean;
  note?: string | null;
}

export interface UpdateUnitRequest {
  name: string;
}

export interface UpdateLocationRequest {
  name?: string;
  unitId?: string;
}

export interface UpdateRankRequest {
  name: string;
}

export interface UpdateOriginRequest {
  name: string;
}

export interface UpdateItemNameRequest {
  name: string;
}

export interface UpdateAllocationRequest {
  unit?: string;
  secondaryUnit?: string;
  owner?: string;
  vehicleType?: string | null;
  idNumber?: string | null;
  standard?: string;
  isIssued?: boolean;
  form624?: string | null;
  is624Issued?: boolean;
  note?: string | null;
}

export interface BulkDeleteRequest {
  ids: string[];
}

// Response types
export interface ManagementResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isConflict?: boolean;
}
