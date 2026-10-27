import { NotificationItem, PicContact, Category } from '../../domain/entities/Category';
import {
  INotificationRepository,
  IPicContactRepository,
  ICategoryRepository,
} from '../../domain/repositories/INotificationRepository';
import { INITIAL_PIC_CONTACTS, INITIAL_CATEGORIES } from '../mock-data/seedUsers';
import { getWIBISOString } from '../../lib/wib-time';

const NOTIFS_STORAGE_KEY = 'e_reservasi_notifs_v1';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    recipientId: 'user-normal-1',
    reservationId: 'res-101',
    title: 'Reservasi Disetujui',
    message: 'Pengajuan ruangan untuk Rakor Penataan Batas Wilayah telah disetujui oleh Sekpim Walikota.',
    type: 'success',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    recipientId: 'user-normal-1',
    reservationId: 'res-104',
    title: 'Pengajuan Diterima Sistem',
    message: 'Pengajuan reservasi Ruang Rapat Aspem telah terkirim dan menunggu verifikasi Asisten.',
    type: 'info',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-3',
    recipientId: 'user-external-1',
    reservationId: 'res-106',
    title: 'Reservasi Ditolak',
    message: 'Pengajuan Ruang Pola ditolak karena berbenturan dengan agenda prioritas Walikota.',
    type: 'error',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

export class MockNotificationRepository implements INotificationRepository {
  private getNotifs(): NotificationItem[] {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    const stored = localStorage.getItem(NOTIFS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  private saveNotifs(items: NotificationItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(items));
    }
  }

  async getNotificationsByUserId(userId: string, userRole?: string): Promise<NotificationItem[]> {
    return this.getNotifs().filter((n) => {
      if (n.recipientId === userId || n.recipientId === 'all') return true;
      if (userRole === 'admin' && n.recipientId === 'admin') return true;
      return false;
    });
  }

  async createNotification(
    data: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>
  ): Promise<NotificationItem> {
    const list = this.getNotifs();
    const newNotif: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: getWIBISOString(),
    };
    list.unshift(newNotif);
    this.saveNotifs(list);
    return newNotif;
  }

  async markAsRead(id: string): Promise<boolean> {
    const list = this.getNotifs();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.saveNotifs(list);
    }
    return true;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const list = this.getNotifs();
    list.forEach((n) => {
      if (n.recipientId === userId || n.recipientId === 'all') {
        n.isRead = true;
      }
    });
    this.saveNotifs(list);
    return true;
  }
}

export class MockPicContactRepository implements IPicContactRepository {
  async getAllPicContacts(): Promise<PicContact[]> {
    return INITIAL_PIC_CONTACTS;
  }

  async getPicContactBySector(sector: string): Promise<PicContact | null> {
    return INITIAL_PIC_CONTACTS.find((p) => p.sectorName.toLowerCase().includes(sector.toLowerCase())) || null;
  }
}

export class MockCategoryRepository implements ICategoryRepository {
  async getAllCategories(): Promise<Category[]> {
    return INITIAL_CATEGORIES;
  }

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const newCat = { ...cat, id: `cat-${Date.now()}` };
    INITIAL_CATEGORIES.push(newCat);
    return newCat;
  }
}

export const mockNotificationRepository = new MockNotificationRepository();
export const mockPicContactRepository = new MockPicContactRepository();
export const mockCategoryRepository = new MockCategoryRepository();

