import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { apiService } from '../services';

export const useUserProfile = () => {
  const { user: firebaseUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!firebaseUser?.email) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the new /users/me endpoint
      const response = await apiService.get('/users/me') as any;
      
      if (response) {
        if (response.needsRegistration) {
          // User exists in Firebase but needs to complete registration
          setNeedsProfile(true);
          setUserProfile(null);
        } else {
          // User is fully registered
          const serverUser = response;
          
          // Transform the server response to match our User interface
          const transformedUser: User = {
            id: serverUser.id,
            name: serverUser.name,
            personalNumber: serverUser.personalNumber,
            phoneNumber: serverUser.phoneNumber,
            rank: serverUser.rank,
            isAdmin: serverUser.isAdmin,
            emailSubscribed: serverUser.emailSubscribed,
            firebaseUid: serverUser.firebaseUid,
            createdAt: serverUser.createdAt,
            updatedAt: serverUser.updatedAt,
            // Transform nested objects to strings as expected by the frontend
            location: serverUser.location?.name || serverUser.location || '',
            unit: serverUser.location?.unit?.name || serverUser.unit || '',
          };
          
          // Check if the user data has all required fields
          const hasRequiredFields = transformedUser.id && transformedUser.personalNumber;

          if (hasRequiredFields) {
            setUserProfile(transformedUser);
            setNeedsProfile(false);
          } else {
            setNeedsProfile(true);
            setUserProfile(null);
          }
        }
      } else {
        // Unexpected response
        setNeedsProfile(true);
        setUserProfile(null);
      }
    } catch (error: any) {
      // If there's an error, assume user needs registration
      setNeedsProfile(true);
      setUserProfile(null);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const createUserProfile = async (profileData: Omit<CreateUserRequest, 'firebaseUid'>): Promise<boolean> => {
    if (!firebaseUser?.email || !firebaseUser?.uid) {
      setError('No authenticated user found');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userData: CreateUserRequest = {
        firebaseUid: firebaseUser.uid,
        name: profileData.name,
        personalNumber: profileData.personalNumber,
        phoneNumber: profileData.phoneNumber,
        rank: profileData.rank,
        locationId: profileData.locationId,
      };

      const response = await apiService.post('/users/register', userData) as any;
      
      if (response) {
        // Transform the server response to match our User interface
        const serverUser = response;
        const transformedUser: User = {
          id: serverUser.id,
          name: serverUser.name,
          personalNumber: serverUser.personalNumber,
          phoneNumber: serverUser.phoneNumber,
          rank: serverUser.rank,
          isAdmin: serverUser.isAdmin,
          emailSubscribed: serverUser.emailSubscribed,
          firebaseUid: serverUser.firebaseUid,
          createdAt: serverUser.createdAt,
          updatedAt: serverUser.updatedAt,
          // Transform nested objects to strings as expected by the frontend
          location: serverUser.location?.name || '',
          unit: serverUser.location?.unit?.name || '',
        };
        
        // Update state in the correct order - profile first, then needsProfile
        setUserProfile(transformedUser);
        setNeedsProfile(false);
        setError(null); // Clear any previous errors
        
        return true;
      } else {
        setError('Registration failed - no user data returned');
        return false;
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: UpdateUserRequest): Promise<boolean> => {
    if (!userProfile) {
      setError('No user profile to update');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.patch(`/users/${userProfile.id}`, updates) as any;
      
      if (response) {
        // Transform the server response to match our User interface
        const serverUser = response;
        const transformedUser: User = {
          id: serverUser.id,
          name: serverUser.name,
          personalNumber: serverUser.personalNumber,
          phoneNumber: serverUser.phoneNumber,
          rank: serverUser.rank,
          isAdmin: serverUser.isAdmin,
          emailSubscribed: serverUser.emailSubscribed,
          firebaseUid: serverUser.firebaseUid,
          createdAt: serverUser.createdAt,
          updatedAt: serverUser.updatedAt,
          // Transform nested objects to strings as expected by the frontend
          location: serverUser.location?.name || serverUser.location || '',
          unit: serverUser.location?.unit?.name || serverUser.unit || '',
        };
        setUserProfile(transformedUser);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userProfile,
    isLoading,
    needsProfile,
    error,
    isAdmin: userProfile ? userProfile.isAdmin : false,
    createUserProfile,
    updateUserProfile,
    refetch: fetchUserProfile
  };
};
