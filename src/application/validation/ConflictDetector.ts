import { Reservation } from '../../domain/entities/Reservation';

export class ConflictDetector {
  /**
   * Mengonversi string waktu 'HH:mm' ke menit untuk perbandingan presisi
   */
  public static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Memeriksa apakah dua rentang waktu saling bertabrakan (overlap)
   */
  public static isOverlapping(
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ): boolean {
    const minStartA = this.timeToMinutes(startA);
    const minEndA = this.timeToMinutes(endA);
    const minStartB = this.timeToMinutes(startB);
    const minEndB = this.timeToMinutes(endB);

    return minStartA < minEndB && minEndA > minStartB;
  }

  /**
   * Memvalidasi pengajuan baru terhadap daftar reservasi yang sudah disetujui
   */
  public static detectConflict(
    targetRoomId: string | undefined,
    targetDate: string,
    targetStartTime: string,
    targetEndTime: string,
    existingReservations: Reservation[],
    excludeReservationId?: string
  ): { hasConflict: boolean; conflictingReservation?: Reservation } {
    if (!targetRoomId) {
      // Jika ruangan khusus / Lainnya (free text), asumsikan tidak memblokir ruangan formal
      return { hasConflict: false };
    }

    const conflict = existingReservations.find((res) => {
      if (excludeReservationId && res.id === excludeReservationId) return false;
      if (res.status !== 'disetujui') return false;
      if (res.roomId !== targetRoomId) return false;
      if (res.eventDate !== targetDate) return false;

      return this.isOverlapping(res.startTime, res.endTime, targetStartTime, targetEndTime);
    });

    return {
      hasConflict: !!conflict,
      conflictingReservation: conflict,
    };
  }
}

