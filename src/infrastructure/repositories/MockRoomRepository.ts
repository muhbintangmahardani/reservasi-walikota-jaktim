import { Room } from '../../domain/entities/Room';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { INITIAL_ROOMS } from '../mock-data/seedRooms';

const STORAGE_KEY = 'e_reservasi_rooms_v1';

export class MockRoomRepository implements IRoomRepository {
  private getRoomsFromStorage(): Room[] {
    if (typeof window === 'undefined') return INITIAL_ROOMS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_ROOMS;
    }
  }

  private saveRooms(rooms: Room[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    }
  }

  async getAllRooms(): Promise<Room[]> {
    return this.getRoomsFromStorage();
  }

  async getActiveRooms(): Promise<Room[]> {
    return this.getRoomsFromStorage().filter((r) => r.isActive);
  }

  async getRoomById(id: string): Promise<Room | null> {
    const rooms = this.getRoomsFromStorage();
    return rooms.find((r) => r.id === id) || null;
  }

  async createRoom(roomData: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
    const rooms = this.getRoomsFromStorage();
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    rooms.push(newRoom);
    this.saveRooms(rooms);
    return newRoom;
  }

  async updateRoom(id: string, roomData: Partial<Room>): Promise<Room> {
    const rooms = this.getRoomsFromStorage();
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Ruangan tidak ditemukan');

    const updated = { ...rooms[index], ...roomData };
    rooms[index] = updated;
    this.saveRooms(rooms);
    return updated;
  }

  async toggleRoomStatus(id: string): Promise<Room> {
    const rooms = this.getRoomsFromStorage();
    const room = rooms.find((r) => r.id === id);
    if (!room) throw new Error('Ruangan tidak ditemukan');

    room.isActive = !room.isActive;
    this.saveRooms(rooms);
    return room;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const rooms = this.getRoomsFromStorage();
    const filtered = rooms.filter((r) => r.id !== id);
    this.saveRooms(filtered);
    return true;
  }
}

export const mockRoomRepository = new MockRoomRepository();

