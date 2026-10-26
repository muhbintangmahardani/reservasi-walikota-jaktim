import { Room } from '../entities/Room';

export interface IRoomRepository {
  getAllRooms(): Promise<Room[]>;
  getActiveRooms(): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | null>;
  createRoom(room: Omit<Room, 'id' | 'createdAt'>): Promise<Room>;
  updateRoom(id: string, room: Partial<Room>): Promise<Room>;
  toggleRoomStatus(id: string): Promise<Room>;
  deleteRoom(id: string): Promise<boolean>;
}

