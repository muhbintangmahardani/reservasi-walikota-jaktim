import { Reservation, ReservationFilter } from '../../domain/entities/Reservation';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { INITIAL_RESERVATIONS } from '../mock-data/seedReservations';
import { ConflictDetector } from '../../application/validation/ConflictDetector';

const STORAGE_KEY = 'e_reservasi_reservations_v1';

export class MockReservationRepository implements IReservationRepository {
  private getReservationsFromStorage(): Reservation[] {
    if (typeof window === 'undefined') return INITIAL_RESERVATIONS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RESERVATIONS));
      return INITIAL_RESERVATIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_RESERVATIONS;
    }
  }

  private saveReservations(reservations: Reservation[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    }
  }

  async getAllReservations(filter?: ReservationFilter): Promise<Reservation[]> {
    let list = this.getReservationsFromStorage();

    if (filter) {
      if (filter.date) {
        list = list.filter((r) => r.eventDate === filter.date);
      }
      if (filter.roomId) {
        list = list.filter((r) => r.roomId === filter.roomId);
      }
      if (filter.status) {
        list = list.filter((r) => r.status === filter.status);
      }
      if (filter.letterOrigin) {
        list = list.filter((r) => r.letterOrigin === filter.letterOrigin);
      }
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        list = list.filter(
          (r) =>
            r.eventName.toLowerCase().includes(q) ||
            r.executorOfficial.toLowerCase().includes(q) ||
            r.roomName.toLowerCase().includes(q) ||
            r.letterOrigin.toLowerCase().includes(q)
        );
      }
    }

    return list.sort((a, b) => {
      // Urutkan tanggal dan jam
      const dateCmp = b.eventDate.localeCompare(a.eventDate);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    return this.getReservationsFromStorage().filter((r) => r.userId === userId);
  }

  async getApprovedReservationsByDate(date: string): Promise<Reservation[]> {
    return this.getReservationsFromStorage().filter(
      (r) => r.eventDate === date && r.status === 'disetujui'
    );
  }

  async getApprovedReservationsByMonth(year: number, month: number): Promise<Reservation[]> {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.getReservationsFromStorage().filter(
      (r) => r.eventDate.startsWith(monthPrefix) && r.status === 'disetujui'
    );
  }

  async getPendingReservations(): Promise<Reservation[]> {
    return this.getReservationsFromStorage().filter((r) => r.status === 'menunggu');
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    const list = this.getReservationsFromStorage();
    return list.find((r) => r.id === id) || null;
  }

  async checkTimeConflict(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<{ hasConflict: boolean; conflictingReservation?: Reservation }> {
    const reservations = this.getReservationsFromStorage();
    return ConflictDetector.detectConflict(roomId, date, startTime, endTime, reservations, excludeReservationId);
  }

  async createReservation(
    data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Reservation> {
    const list = this.getReservationsFromStorage();

    // Validasi otomatis bentrokan sebelum create jika ada roomId
    if (data.roomId) {
      const conflict = await this.checkTimeConflict(data.roomId, data.eventDate, data.startTime, data.endTime);
      if (conflict.hasConflict) {
        throw new Error(
          `Jadwal bentrok dengan kegiatan "${conflict.conflictingReservation?.eventName}" (${conflict.conflictingReservation?.startTime} - ${conflict.conflictingReservation?.endTime})`
        );
      }
    }

    const now = new Date().toISOString();
    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}`,
      status: 'menunggu',
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newReservation);
    this.saveReservations(list);
    return newReservation;
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const list = this.getReservationsFromStorage();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Reservasi tidak ditemukan');

    const updated = {
      ...list[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    this.saveReservations(list);
    return updated;
  }

  async approveReservation(
    id: string,
    categoryId: string,
    categoryName: string,
    verifierId: string,
    verifierName: string
  ): Promise<Reservation> {
    const list = this.getReservationsFromStorage();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Reservasi tidak ditemukan');

    const target = list[idx];
    // Pastikan saat diapprove tidak bentrok
    if (target.roomId) {
      const conflict = await this.checkTimeConflict(
        target.roomId,
        target.eventDate,
        target.startTime,
        target.endTime,
        id
      );
      if (conflict.hasConflict) {
        throw new Error(`Tidak dapat disetujui: Bentrok dengan jadwal "${conflict.conflictingReservation?.eventName}"`);
      }
    }

    const updated: Reservation = {
      ...target,
      status: 'disetujui',
      categoryId,
      categoryName,
      verifiedBy: verifierId,
      verifiedByName: verifierName,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.saveReservations(list);
    return updated;
  }

  async rejectReservation(
    id: string,
    reason: string,
    verifierId: string,
    verifierName: string
  ): Promise<Reservation> {
    const list = this.getReservationsFromStorage();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Reservasi tidak ditemukan');

    const updated: Reservation = {
      ...list[idx],
      status: 'ditolak',
      rejectionReason: reason,
      verifiedBy: verifierId,
      verifiedByName: verifierName,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.saveReservations(list);
    return updated;
  }

  async deleteReservation(id: string): Promise<boolean> {
    const list = this.getReservationsFromStorage();
    const filtered = list.filter((r) => r.id !== id);
    this.saveReservations(filtered);
    return true;
  }
}

export const mockReservationRepository = new MockReservationRepository();

