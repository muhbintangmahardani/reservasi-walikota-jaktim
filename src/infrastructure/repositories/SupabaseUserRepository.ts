import { UserProfile } from '../../domain/entities/UserProfile';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { createClient } from '../supabase/client';

export class SupabaseUserRepository implements IUserRepository {
  private supabase = createClient();

  private mapFromDb(row: any): UserProfile {
    return {
      id: row.id,
      fullName: row.full_name,
      unitName: row.unit_name,
      role: row.role,
      userType: row.user_type,
      email: row.email || row.phone_number || '',
      phoneNumber: row.phone_number,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapFromDb(data);
  }

  async createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({
        full_name: userData.fullName,
        unit_name: userData.unitName,
        role: userData.role,
        user_type: userData.userType,
        email: userData.email,
        phone_number: userData.phoneNumber,
        is_active: userData.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async updateUser(id: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    const payload: any = {};
    if (userData.fullName !== undefined) payload.full_name = userData.fullName;
    if (userData.unitName !== undefined) payload.unit_name = userData.unitName;
    if (userData.role !== undefined) payload.role = userData.role;
    if (userData.userType !== undefined) payload.user_type = userData.userType;
    if (userData.email !== undefined) payload.email = userData.email;
    if (userData.phoneNumber !== undefined) payload.phone_number = userData.phoneNumber;
    if (userData.isActive !== undefined) payload.is_active = userData.isActive;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async toggleUserStatus(id: string): Promise<UserProfile> {
    const current = await this.getUserById(id);
    if (!current) throw new Error('Pengguna tidak ditemukan');

    return this.updateUser(id, { isActive: !current.isActive });
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
