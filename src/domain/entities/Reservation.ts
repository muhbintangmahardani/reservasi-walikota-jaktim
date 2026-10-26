export type ReservationStatus = 'menunggu' | 'disetujui' | 'ditolak';

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roomId?: string; // If null, customRoomName is used
  roomName: string;
  customRoomName?: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  executorOfficial: string; // Pejabat Pelaksana
  accompanyingOfficial: string; // Pejabat Pendamping
  dressCode: string; // Pakaian
  letterOrigin: string; // Asal Surat / Bagian
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  status: ReservationStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationFilter {
  date?: string;
  roomId?: string;
  status?: ReservationStatus;
  letterOrigin?: string;
  searchQuery?: string;
}

