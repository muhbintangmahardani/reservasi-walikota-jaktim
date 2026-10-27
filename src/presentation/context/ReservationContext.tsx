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
  getUserRepository,
} from '../../infrastructure/repositories';
import { isSupabaseConfigured, createClient } from '../../infrastructure/supabase/client';
import { useAuth } from './AuthContext';
import { getWIBISOString } from '../../lib/wib-time';

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

  const isInitialLoadRef = React.useRef(true);
  const realtimeChannelRef = React.useRef<any>(null);
  const localBcRef = React.useRef<BroadcastChannel | null>(null);

  // Broadcast sync helper: memancarkan sinyal ke seluruh tab dan browser lain secara realtime
  const broadcastSync = useCallback((action: string) => {
    // 1. Supabase WebSocket Broadcast (lintas browser, device, incognito)
    if (realtimeChannelRef.current) {
      try {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'system_sync',
          payload: { action, timestamp: Date.now() },
        });
      } catch (err) {
        console.warn('Supabase broadcast send error:', err);
      }
    }

    // 2. Standard Web BroadcastChannel (lintas tab/window pada browser yang sama)
    if (typeof window !== 'undefined' && localBcRef.current) {
      try {
        localBcRef.current.postMessage({ action, timestamp: Date.now() });
      } catch (err) {
        console.warn('Local BroadcastChannel error:', err);
      }
    }

    // 3. LocalStorage event trigger (fallback lintas tab)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('e_reservasi_cross_tab_sync', String(Date.now()));
      } catch {}
    }
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent && isInitialLoadRef.current) {
      setIsLoading(true);
    }
    try {
      const [resList, roomList, catList, picList, notifList] = await Promise.all([
        reservationRepo.getAllReservations(),
        roomRepo.getAllRooms(),
        categoryRepo.getAllCategories(),
        picContactRepo.getAllPicContacts(),
        currentUser?.id ? notificationRepo.getNotificationsByUserId(currentUser.id, currentUser.role) : Promise.resolve([]),
      ]);
      
      // Settling delay hanya pada render pertama kali untuk animasi skeleton yang halus
      if (isInitialLoadRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        isInitialLoadRef.current = false;
      }
      
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

  // Listener Multi-Browser & Multi-Tab Realtime Sync
  useEffect(() => {
    // 1. Web BroadcastChannel untuk tab lokal
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('e_reservasi_sync');
        localBcRef.current = bc;
        bc.onmessage = () => {
          loadData(true);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }

    // 2. LocalStorage storage event fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'e_reservasi_cross_tab_sync') {
        loadData(true);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    // 3. Supabase Realtime WebSocket (Broadcast + Postgres Changes)
    let channel: any = null;
    let supabaseClient: any = null;

    if (isSupabaseConfigured()) {
      try {
        supabaseClient = createClient();
        channel = supabaseClient.channel('realtime_e_reservasi', {
          config: { broadcast: { self: false } },
        });

        realtimeChannelRef.current = channel;

        channel
          .on('broadcast', { event: 'system_sync' }, () => {
            loadData(true);
          })
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'reservations' },
            () => {
              loadData(true);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            () => {
              loadData(true);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms' },
            () => {
              loadData(true);
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Supabase Realtime subscription error:', err);
      }
    }

    // 4. Smart Silent Polling (Setiap 4 detik sinkronisasi di latar belakang saat tab aktif)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
      if (localBcRef.current) {
        localBcRef.current.close();
      }
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [loadData]);

  const fetchReservations = async (filter?: ReservationFilter) => {
    const list = await reservationRepo.getAllReservations(filter);
    setReservations(list);
  };

  const createReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const res = await reservationRepo.createReservation(data);
    
    // Injeksi state seketika secara realtime untuk kalender, riwayat saya, meja verifikasi & jadwal pimpinan
    setReservations((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);

    // 1. Notifikasi untuk akun pemohon (User)
    if (currentUser?.id) {
      try {
        const notif = await notificationRepo.createNotification({
          recipientId: currentUser.id,
          reservationId: res.id,
          title: 'Pengajuan Reservasi Terkirim',
          message: `Pengajuan ruangan "${res.roomName}" untuk acara "${res.eventName}" berhasil dikirim dan sedang menunggu verifikasi Sekpim.`,
          type: 'info',
        });
        if (notif && notif.recipientId === currentUser.id) {
          setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
        }
      } catch (e) {
        console.warn('Could not insert user notification to DB:', e);
      }
    }

    // 2. Notifikasi untuk para Verifikator & Admin (Walikota, Aspem, Admin)
    try {
      const userRepo = getUserRepository();
      const allUsers = await userRepo.getAllUsers();
      const verifiers = allUsers.filter(
        (u) =>
          u.isActive &&
          (u.role === 'verifikator_pimpinan' ||
           u.role === 'verifikator_asisten' ||
           u.role === 'admin') &&
          u.id !== currentUser?.id
      );

      for (const verifier of verifiers) {
        await notificationRepo.createNotification({
          recipientId: verifier.id,
          reservationId: res.id,
          title: 'Permohonan Reservasi Baru',
          message: `"${res.userName}" (${res.letterOrigin || 'OPD'}) mengajukan reservasi "${res.roomName}" untuk acara "${res.eventName}" pada tanggal ${res.eventDate}. Menunggu verifikasi.`,
          type: 'warning',
        });
      }
    } catch (e) {
      console.warn('Could not insert verifier notification:', e);
    }
    
    // Siarkan sinyal realtime ke seluruh tab & browser lain
    broadcastSync('RESERVATION_CREATED');

    // Sinkronisasi data di background tanpa skeleton shimmer
    loadData(true);
    return res;
  };

  const updateReservation = async (id: string, data: Partial<Reservation>, notifyMessage?: string) => {
    // Injeksi perubahan seketika
    const nowWib = getWIBISOString();
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data, updatedAt: nowWib } : r))
    );

    const updated = await reservationRepo.updateReservation(id, data);
    setReservations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    
    // Kirim notifikasi perubahan jadwal ke pemohon (bukan ke verifikator)
    const finalMsg =
      notifyMessage ||
      `Detail jadwal reservasi "${updated.eventName}" (${updated.roomName}) telah disesuaikan oleh ${currentUser?.fullName || 'Pimpinan/Verifikator'}. Silakan periksa riwayat reservasi Anda.`;

    try {
      const notif = await notificationRepo.createNotification({
        recipientId: updated.userId,
        reservationId: updated.id,
        title: 'Jadwal Reservasi Diperbarui',
        message: finalMsg,
        type: 'warning',
      });
      // Hanya masukkan ke notif lokal jika user yang login adalah si pemohon
      if (notif && currentUser?.id === updated.userId) {
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      }
    } catch (e) {
      console.warn('Could not insert notification to DB:', e);
    }

    broadcastSync('RESERVATION_UPDATED');
    loadData(true);
    return updated;
  };

  const approveReservation = async (id: string, categoryId: string, categoryName: string) => {
    const nowWib = getWIBISOString();
    // 1. Optimistic instant UI update di browser verifikator
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'disetujui' as const,
              categoryId,
              categoryName,
              verifiedBy: currentUser?.fullName || 'Pimpinan',
              verifiedAt: nowWib,
              updatedAt: nowWib,
            }
          : r
      )
    );

    const updated = await reservationRepo.approveReservation(
      id,
      categoryId,
      categoryName,
      currentUser?.id || 'system',
      currentUser?.fullName || 'Pimpinan'
    );

    setReservations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    // 2. Notifikasi HANYA dikirim ke USER PEMOHON (Budi), BUKAN ke verifikator!
    try {
      const notif = await notificationRepo.createNotification({
        recipientId: updated.userId,
        reservationId: updated.id,
        title: 'Reservasi Disetujui!',
        message: `Pengajuan ruangan "${updated.roomName}" untuk acara "${updated.eventName}" telah diverifikasi dan disetujui oleh ${currentUser?.fullName || 'Pimpinan'}. Jadwal resmi telah diblock di kalender.`,
        type: 'success',
      });
      // PENTING: Hanya masukkan ke notif lokal jika akun yang sedang login adalah si pemohon!
      if (notif && currentUser?.id === updated.userId) {
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      }
    } catch (e) {
      console.warn('Could not insert notification:', e);
    }

    // 3. Siarkan sinyal realtime ke seluruh browser (agar browser user langsung terupdate seketika)
    broadcastSync('RESERVATION_APPROVED');

    loadData(true);
    return updated;
  };

  const rejectReservation = async (id: string, reason: string) => {
    const nowWib = getWIBISOString();
    // 1. Optimistic instant UI update di browser verifikator
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'ditolak' as const,
              rejectionReason: reason,
              verifiedBy: currentUser?.fullName || 'Pimpinan',
              verifiedAt: nowWib,
              updatedAt: nowWib,
            }
          : r
      )
    );

    const updated = await reservationRepo.rejectReservation(
      id,
      reason,
      currentUser?.id || 'system',
      currentUser?.fullName || 'Pimpinan'
    );

    setReservations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    // 2. Notifikasi HANYA dikirim ke USER PEMOHON, BUKAN ke verifikator!
    try {
      const notif = await notificationRepo.createNotification({
        recipientId: updated.userId,
        reservationId: updated.id,
        title: 'Reservasi Ditolak',
        message: `Pengajuan ruangan "${updated.roomName}" untuk acara "${updated.eventName}" ditolak oleh ${currentUser?.fullName || 'Pimpinan'}. Alasan: ${reason}`,
        type: 'error',
      });
      // PENTING: Hanya masukkan ke notif lokal jika akun yang sedang login adalah si pemohon!
      if (notif && currentUser?.id === updated.userId) {
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      }
    } catch (e) {
      console.warn('Could not insert notification:', e);
    }

    // 3. Siarkan sinyal realtime ke seluruh browser
    broadcastSync('RESERVATION_REJECTED');

    loadData(true);
    return updated;
  };

  const deleteReservation = async (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    const success = await reservationRepo.deleteReservation(id);
    if (success) {
      broadcastSync('RESERVATION_DELETED');
      loadData(true);
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
      broadcastSync('ROOM_STATUS_TOGGLED');
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
