import { UserProfile } from '../entities/UserProfile';

export interface IUserRepository {
  getAllUsers(): Promise<UserProfile[]>;
  getUserById(id: string): Promise<UserProfile | null>;
  createUser(user: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile>;
  updateUser(id: string, user: Partial<UserProfile>): Promise<UserProfile>;
  deleteUser(id: string): Promise<boolean>;
  toggleUserStatus(id: string): Promise<UserProfile>;
}

