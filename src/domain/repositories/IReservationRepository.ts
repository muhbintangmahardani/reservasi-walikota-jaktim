import { Reservation, ReservationFilter } from '../entities/Reservation';

export interface IReservationRepository {
  getAllReservations(filter?: ReservationFilter): Promise<Reservation[]>;
  getReservationsByUserId(userId: string): Promise<Reservation[]>;
  getApprovedReservationsByDate(date: string): Promise<Reservation[]>;
  getApprovedReservationsByMonth(year: number, month: number): Promise<Reservation[]>;
  getPendingReservations(): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | null>;
  
  createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reservation>;
  updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation>;
  approveReservation(id: string, categoryId: string, categoryName: string, verifierId: string, verifierName: string): Promise<Reservation>;
  rejectReservation(id: string, reason: string, verifierId: string, verifierName: string): Promise<Reservation>;
  deleteReservation(id: string): Promise<boolean>;
  
  checkTimeConflict(roomId: string, date: string, startTime: string, endTime: string, excludeReservationId?: string): Promise<{
    hasConflict: boolean;
    conflictingReservation?: Reservation;
  }>;
}

