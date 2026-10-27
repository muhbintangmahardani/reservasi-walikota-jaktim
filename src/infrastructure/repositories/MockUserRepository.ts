import { UserProfile } from '../../domain/entities/UserProfile';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { INITIAL_USERS } from '../mock-data/seedUsers';
import { getWIBISOString } from '../../lib/wib-time';

const STORAGE_KEY = 'e_reservasi_users_v1';

export class MockUserRepository implements IUserRepository {
  private getUsersFromStorage(): UserProfile[] {
    if (typeof window === 'undefined') return INITIAL_USERS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_USERS;
    }
  }

  private saveUsers(users: UserProfile[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return this.getUsersFromStorage();
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const list = this.getUsersFromStorage();
    return list.find((u) => u.id === id) || null;
  }

  async createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile> {
    const list = this.getUsersFromStorage();
    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: getWIBISOString(),
    };
    list.push(newUser);
    this.saveUsers(list);
    return newUser;
  }

  async updateUser(id: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    const list = this.getUsersFromStorage();
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Pengguna tidak ditemukan');

    const updated = { ...list[idx], ...userData };
    list[idx] = updated;
    this.saveUsers(list);
    return updated;
  }

  async toggleUserStatus(id: string): Promise<UserProfile> {
    const list = this.getUsersFromStorage();
    const user = list.find((u) => u.id === id);
    if (!user) throw new Error('Pengguna tidak ditemukan');

    user.isActive = !user.isActive;
    this.saveUsers(list);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const list = this.getUsersFromStorage();
    const filtered = list.filter((u) => u.id !== id);
    this.saveUsers(filtered);
    return true;
  }
}

export const mockUserRepository = new MockUserRepository();

