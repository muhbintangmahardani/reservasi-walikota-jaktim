export interface Room {
  id: string;
  name: string;
  buildingFloor: string;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

