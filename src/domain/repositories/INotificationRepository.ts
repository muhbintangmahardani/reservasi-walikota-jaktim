import { NotificationItem, PicContact, Category } from '../entities/Category';

export interface INotificationRepository {
  getNotificationsByUserId(userId: string, userRole?: string): Promise<NotificationItem[]>;
  createNotification(notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationItem>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<boolean>;
}

export interface IPicContactRepository {
  getAllPicContacts(): Promise<PicContact[]>;
  getPicContactBySector(sector: string): Promise<PicContact | null>;
}

export interface ICategoryRepository {
  getAllCategories(): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;
}

