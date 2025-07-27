import { apiService } from './api.service';
import { User, CreateUserRequest } from '../types';

export const userService = {
  // Get all users
  async getAll(): Promise<User[]> {
    return apiService.get<User[]>('/users');
  },

  // Create a new user
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

  // Get user by ID
  async getById(userId: string): Promise<User> {
    return apiService.get<User>(`/users/${userId}`);
  },
};
