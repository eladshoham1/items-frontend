import { apiService } from './api.service';
import { User, CreateUserRequest } from '../types';

export const userService = {
  // Get current user information
  async getCurrentUser(): Promise<any> {
    return apiService.get<any>('/users/me');
  },

  // Register a new user
  async register(userData: CreateUserRequest): Promise<User> {
    return apiService.post<User>('/users/register', userData);
  },

  // Get locations for registration (available to all users)
  async getLocationsForRegistration(): Promise<any[]> {
    return apiService.get<any[]>('/users/locations');
  },

  // Get all users (admin only)
  async getAll(): Promise<User[]> {
    return apiService.get<User[]>('/users');
  },

  // Create a new user (admin only - different from register)
  async create(userData: CreateUserRequest): Promise<User> {
    return apiService.post<User>('/users', userData);
  },

  // Update an existing user
  async update(userId: string, userData: Partial<CreateUserRequest>): Promise<User> {
    return apiService.patch<User>(`/users/${userId}`, userData);
  },

  // Delete a user
  async delete(userId: string): Promise<void> {
    return apiService.delete<void>(`/users/${userId}`);
  },

  // Delete multiple users
  async deleteMany(ids: string[]): Promise<any> {
    return apiService.delete<any>('/users', { data: { ids } });
  },

  // Get user by ID
  async getById(userId: string): Promise<User> {
    return apiService.get<User>(`/users/${userId}`);
  },
};
