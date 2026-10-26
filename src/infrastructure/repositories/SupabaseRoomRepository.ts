import { Room } from '../../domain/entities/Room';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { createClient } from '../supabase/client';

export class SupabaseRoomRepository implements IRoomRepository {
  private supabase = createClient();

  private mapFromDb(row: any): Room {
    return {
      id: row.id,
      name: row.name,
      buildingFloor: row.building_floor,
      capacity: row.capacity,
      facilities: row.facilities || [],
      isActive: row.is_active,
      imageUrl: row.image_url,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  async getAllRooms(): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getActiveRooms(): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getRoomById(id: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapFromDb(data);
  }

  async createRoom(roomData: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
    const { data, error } = await this.supabase
      .from('rooms')
      .insert({
        name: roomData.name,
        building_floor: roomData.buildingFloor,
        capacity: roomData.capacity,
        facilities: roomData.facilities,
        is_active: roomData.isActive,
        image_url: roomData.imageUrl,
        description: roomData.description,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async updateRoom(id: string, roomData: Partial<Room>): Promise<Room> {
    const payload: any = {};
    if (roomData.name !== undefined) payload.name = roomData.name;
    if (roomData.buildingFloor !== undefined) payload.building_floor = roomData.buildingFloor;
    if (roomData.capacity !== undefined) payload.capacity = roomData.capacity;
    if (roomData.facilities !== undefined) payload.facilities = roomData.facilities;
    if (roomData.isActive !== undefined) payload.is_active = roomData.isActive;
    if (roomData.imageUrl !== undefined) payload.image_url = roomData.imageUrl;
    if (roomData.description !== undefined) payload.description = roomData.description;

    const { data, error } = await this.supabase
      .from('rooms')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async toggleRoomStatus(id: string): Promise<Room> {
    const current = await this.getRoomById(id);
    if (!current) throw new Error('Ruangan tidak ditemukan');

    return this.updateRoom(id, { isActive: !current.isActive });
  }

  async deleteRoom(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('rooms').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

