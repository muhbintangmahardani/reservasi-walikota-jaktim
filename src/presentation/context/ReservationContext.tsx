'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Reservation, ReservationFilter } from '../../domain/entities/Reservation';
import { Room } from '../../domain/entities/Room';
import { NotificationItem, PicContact, Category } from '../../domain/entities/Category';
import {
  getReservationRepository,
  getRoomRepository,
  getNotificationRepository,
  getPicContactRepository,
  getCategoryRepository,
} from '../../infrastructure/repositories';
import { isSupabaseConfigured, createClient } from '../../infrastructure/supabase/client';
import { useAuth } from './AuthContext';

interface ReservationContextType {
  reservations: Reservation[];
  rooms: Room[];
  activeRooms: Room[];
  categories: Category[];
  picContacts: PicContact[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  isLoading: boolean;
  isBackendConnected: boolean;
  
  // Actions
  fetchReservations: (filter?: ReservationFilter) => Promise<void>;
  createReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Reservation>;
  updateReservation: (id: string, data: Partial<Reservation>, notifyMessage?: string) => Promise<Reservation>;
  approveReservation: (id: string, categoryId: string, categoryName: string) => Promise<Reservation>;
  rejectReservation: (id: string, reason: string) => Promise<Reservation>;
  deleteReservation: (id: string) => Promise<boolean>;
  toggleRoomStatus: (id: string) => Promise<void>;
  checkConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => Promise<{ hasConflict: boolean; conflictingReservation?: Reservation }>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [picContacts, setPicContacts] = useState<PicContact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reservationRepo = getReservationRepository();
  const roomRepo = getRoomRepository();
  const categoryRepo = getCategoryRepository();
  const picContactRepo = getPicContactRepository();
  const notificationRepo = getNotificationRepository();

  const isBackendConnected = isSupabaseConfigured();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resList, roomList, catList, picList, notifList] = await Promise.all([
        reservationRepo.getAllReservations(),
        roomRepo.getAllRooms(),
        categoryRepo.getAllCategories(),
        picContactRepo.getAllPicContacts(),
        currentUser ? notificationRepo.getNotificationsByUserId(currentUser.id, currentUser.role) : Promise.resolve([]),
      ]);
      // Settling delay so skeleton shimmer is visible during initial load
      await new Promise((resolve) => setTimeout(resolve, 400));
      setReservations(resList);
      setRooms(roomList);
      setCategories(catList);
      setPicContacts(picList);
      setNotifications(notifList);
    } catch (err) {
      console.error('Error loading reservation context data', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime Listener (Auto update upon changes across all tabs/devices)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel('realtime_e_reservasi')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reservations' },
          () => {
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Supabase Realtime subscription error:', err);
    }
  }, [loadData]);

  const fetchReservations = async (filter?: ReservationFilter) => {
    const list = await reservationRepo.getAllReservations(filter);
    setReservations(list);
  };

  const createReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const res = await reservationRepo.createReservation(data);
    if (currentUser) {
      try {
        await notificationRepo.createNotification({
          recipientId: currentUser.id,
          reservationId: res.id,
          title: 'Pengajuan Reservasi Berhasil',
          message: `Pengajuan ruangan "${res.roomName}" untuk acara "${res.eventName}" sedang menunggu verifikasi Sekpim.`,
          type: 'info',
        });
      } catch (e) {
        console.warn('Could not insert notification to DB:', e);
      }
    }
    await loadData();
    return res;
  };

  const updateReservation = async (id: string, data: Partial<Reservation>, notifyMessage?: string) => {
    const updated = await reservationRepo.updateReservation(id, data);
    
    // Kirim notifikasi perubahan jika diubah oleh asisten/pimpinan ke pemohon
    if (notifyMessage) {
      await notificationRepo.createNotification({
        recipientId: updated.userId,
        reservationId: updated.id,
        title: 'Perubahan Data Reservasi',
        message: notifyMessage,
        type: 'warning',
      });
    }

    await loadData();
    return updated;
  };

  const approveReservation = async (id: string, categoryId: string, categoryName: string) => {
    const updated = await reservationRepo.approveReservation(
      id,
      categoryId,
      categoryName,
      currentUser?.id || 'system',
      currentUser?.fullName || 'Pimpinan'
    );

    // Notifikasi internal ke user pemohon
    await notificationRepo.createNotification({
      recipientId: updated.userId,
      reservationId: updated.id,
      title: 'Reservasi Disetujui!',
      message: `Pengajuan ruangan "${updated.roomName}" untuk "${updated.eventName}" telah diverifikasi dan disetujui. Jadwal resmi telah diblock di kalender.`,
      type: 'success',
    });

    await loadData();
    return updated;
  };

  const rejectReservation = async (id: string, reason: string) => {
    const updated = await reservationRepo.rejectReservation(
      id,
      reason,
      currentUser?.id || 'system',
      currentUser?.fullName || 'Pimpinan'
    );

    // Notifikasi internal ke user pemohon
    await notificationRepo.createNotification({
      recipientId: updated.userId,
      reservationId: updated.id,
      title: 'Reservasi Ditolak',
      message: `Pengajuan ruangan "${updated.roomName}" untuk "${updated.eventName}" ditolak. Alasan: ${reason}`,
      type: 'error',
    });

    await loadData();
    return updated;
  };

  const deleteReservation = async (id: string) => {
    const success = await reservationRepo.deleteReservation(id);
    if (success) {
      await loadData();
    }
    return success;
  };

  const toggleRoomStatus = async (id: string) => {
    // 1. Optimistic update agar badge dan status di UI langsung berubah seketika
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    try {
      const updated = await roomRepo.toggleRoomStatus(id);
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: updated.isActive } : r))
      );
    } catch (err) {
      // Revert jika gagal
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
      );
      throw err;
    }
  };

  const checkConflict = async (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => {
    return reservationRepo.checkTimeConflict(roomId, date, startTime, endTime, excludeId);
  };

  const markNotificationAsRead = async (id: string) => {
    await notificationRepo.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    await notificationRepo.markAllAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const activeRooms = rooms.filter((r) => r.isActive);
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        rooms,
        activeRooms,
        categories,
        picContacts,
        notifications,
        unreadNotifsCount,
        isLoading,
        isBackendConnected,
        fetchReservations,
        createReservation,
        updateReservation,
        approveReservation,
        rejectReservation,
        deleteReservation,
        toggleRoomStatus,
        checkConflict,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = (): ReservationContextType => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
};
