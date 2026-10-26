import { Reservation, ReservationFilter } from '../../domain/entities/Reservation';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { createClient } from '../supabase/client';

export class SupabaseReservationRepository implements IReservationRepository {
  private supabase = createClient();

  private mapFromDb(row: any): Reservation {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.profiles?.full_name || 'Pegawai Pemkot',
      userEmail: row.profiles?.email || 'pegawai@jakarta.go.id',
      roomId: row.room_id,
      roomName: row.rooms?.name || row.custom_room_name || 'Ruangan Rapat',
      customRoomName: row.custom_room_name,
      eventName: row.event_name,
      eventDate: row.event_date,
      startTime: row.start_time?.slice(0, 5) || '08:00',
      endTime: row.end_time?.slice(0, 5) || '11:00',
      executorOfficial: row.executor_official,
      accompanyingOfficial: row.accompanying_official,
      dressCode: row.dress_code,
      letterOrigin: row.letter_origin,
      categoryId: row.category_id,
      categoryName: row.categories?.name,
      categoryColor: row.categories?.color_code,
      status: row.status,
      rejectionReason: row.rejection_reason,
      verifiedBy: row.verified_by,
      verifiedByName: row.verifier?.full_name,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAllReservations(filter?: ReservationFilter): Promise<Reservation[]> {
    let query = this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .order('event_date', { ascending: false })
      .order('start_time', { ascending: true });

    if (filter) {
      if (filter.date) query = query.eq('event_date', filter.date);
      if (filter.roomId) query = query.eq('room_id', filter.roomId);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.letterOrigin) query = query.eq('letter_origin', filter.letterOrigin);
      if (filter.searchQuery) {
        query = query.or(`event_name.ilike.%${filter.searchQuery}%,executor_official.ilike.%${filter.searchQuery}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getApprovedReservationsByDate(date: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .eq('event_date', date)
      .eq('status', 'disetujui')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getApprovedReservationsByMonth(year: number, month: number): Promise<Reservation[]> {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .gte('event_date', startStr)
      .lte('event_date', endStr)
      .eq('status', 'disetujui');

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getPendingReservations(): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .eq('status', 'menunggu')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code),
        verifier:verified_by(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapFromDb(data);
  }

  async checkTimeConflict(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<{ hasConflict: boolean; conflictingReservation?: Reservation }> {
    if (!roomId) return { hasConflict: false };

    // Query conflict using Postgres overlap logic
    let query = this.supabase
      .from('reservations')
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code)
      `)
      .eq('room_id', roomId)
      .eq('event_date', date)
      .eq('status', 'disetujui')
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return {
        hasConflict: true,
        conflictingReservation: this.mapFromDb(data[0]),
      };
    }

    return { hasConflict: false };
  }

  async createReservation(
    data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Reservation> {
    // Check conflict first if roomId exists
    if (data.roomId) {
      const conflict = await this.checkTimeConflict(data.roomId, data.eventDate, data.startTime, data.endTime);
      if (conflict.hasConflict) {
        throw new Error(
          `Jadwal bentrok dengan kegiatan "${conflict.conflictingReservation?.eventName}" (${conflict.conflictingReservation?.startTime} - ${conflict.conflictingReservation?.endTime})`
        );
      }
    }

    const { data: inserted, error } = await this.supabase
      .from('reservations')
      .insert({
        user_id: data.userId,
        room_id: data.roomId,
        custom_room_name: data.customRoomName,
        event_name: data.eventName,
        event_date: data.eventDate,
        start_time: data.startTime,
        end_time: data.endTime,
        executor_official: data.executorOfficial,
        accompanying_official: data.accompanyingOfficial,
        dress_code: data.dressCode,
        letter_origin: data.letterOrigin,
        status: 'menunggu',
      })
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name)
      `)
      .single();

    if (error) throw error;
    return this.mapFromDb(inserted);
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const payload: any = {};
    if (data.eventName !== undefined) payload.event_name = data.eventName;
    if (data.eventDate !== undefined) payload.event_date = data.eventDate;
    if (data.startTime !== undefined) payload.start_time = data.startTime;
    if (data.endTime !== undefined) payload.end_time = data.endTime;
    if (data.executorOfficial !== undefined) payload.executor_official = data.executorOfficial;
    if (data.accompanyingOfficial !== undefined) payload.accompanying_official = data.accompanyingOfficial;
    if (data.dressCode !== undefined) payload.dress_code = data.dressCode;
    if (data.letterOrigin !== undefined) payload.letter_origin = data.letterOrigin;
    if (data.status !== undefined) payload.status = data.status;
    if (data.categoryId !== undefined) payload.category_id = data.categoryId;
    if (data.rejectionReason !== undefined) payload.rejection_reason = data.rejectionReason;

    payload.updated_at = new Date().toISOString();

    const { data: updated, error } = await this.supabase
      .from('reservations')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code)
      `)
      .single();

    if (error) throw error;
    return this.mapFromDb(updated);
  }

  async approveReservation(
    id: string,
    categoryId: string,
    categoryName: string,
    verifierId: string,
    verifierName: string
  ): Promise<Reservation> {
    const current = await this.getReservationById(id);
    if (!current) throw new Error('Reservasi tidak ditemukan');

    if (current.roomId) {
      const conflict = await this.checkTimeConflict(
        current.roomId,
        current.eventDate,
        current.startTime,
        current.endTime,
        id
      );
      if (conflict.hasConflict) {
        throw new Error(`Bentrok dengan jadwal: ${conflict.conflictingReservation?.eventName}`);
      }
    }

    const { data: updated, error } = await this.supabase
      .from('reservations')
      .update({
        status: 'disetujui',
        category_id: categoryId.startsWith('cat-') || categoryId === 'custom' ? null : categoryId,
        verified_by: verifierId.startsWith('user-') ? null : verifierId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code)
      `)
      .single();

    if (error) throw error;
    return this.mapFromDb(updated);
  }

  async rejectReservation(
    id: string,
    reason: string,
    verifierId: string,
    verifierName: string
  ): Promise<Reservation> {
    const { data: updated, error } = await this.supabase
      .from('reservations')
      .update({
        status: 'ditolak',
        rejection_reason: reason,
        verified_by: verifierId.startsWith('user-') ? null : verifierId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        profiles:user_id(full_name),
        rooms:room_id(name),
        categories:category_id(name, color_code)
      `)
      .single();

    if (error) throw error;
    return this.mapFromDb(updated);
  }

  async deleteReservation(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('reservations').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

