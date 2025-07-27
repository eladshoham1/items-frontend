import { useState, useEffect } from 'react';
import { userService } from '../services';
import { User, CreateUserRequest } from '../types';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]); // Ensure empty array on error
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserRequest): Promise<boolean> => {
    try {
      setError(null);
      await userService.create(userData);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      console.error('Failed to create user:', err);
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<CreateUserRequest>): Promise<boolean> => {
    try {
      setError(null);
      await userService.update(userId, userData);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('Failed to update user:', err);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setError(null);
      await userService.delete(userId);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('Failed to delete user:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
