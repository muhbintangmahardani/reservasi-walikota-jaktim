import { NotificationItem, PicContact, Category } from '../../domain/entities/Category';
import {
  INotificationRepository,
  IPicContactRepository,
  ICategoryRepository,
} from '../../domain/repositories/INotificationRepository';
import { createClient } from '../supabase/client';
import { getWIBISOString } from '../../lib/wib-time';

export class SupabaseNotificationRepository implements INotificationRepository {
  private supabase = createClient();

  async getNotificationsByUserId(userId: string, userRole?: string): Promise<NotificationItem[]> {
    const recipients = [userId, 'all'];
    if (userRole === 'admin') {
      recipients.push('admin');
    }

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .in('recipient_id', recipients)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      recipientId: row.recipient_id,
      reservationId: row.reservation_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));
  }

  async createNotification(
    data: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>
  ): Promise<NotificationItem> {
    const nowWib = getWIBISOString();
    const { data: inserted, error } = await this.supabase
      .from('notifications')
      .insert({
        recipient_id: data.recipientId,
        reservation_id: data.reservationId,
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: false,
        created_at: nowWib,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: inserted.id,
      recipientId: inserted.recipient_id,
      reservationId: inserted.reservation_id,
      title: inserted.title,
      message: inserted.message,
      type: inserted.type,
      isRead: inserted.is_read,
      createdAt: inserted.created_at,
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  }
}

export class SupabasePicContactRepository implements IPicContactRepository {
  private supabase = createClient();

  async getAllPicContacts(): Promise<PicContact[]> {
    const { data, error } = await this.supabase
      .from('pic_contacts')
      .select('*')
      .eq('is_active', true)
      .order('sector_name');

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      sectorName: row.sector_name,
      picName: row.pic_name,
      whatsappNumber: row.whatsapp_number,
      email: row.email,
      isActive: row.is_active,
    }));
  }

  async getPicContactBySector(sector: string): Promise<PicContact | null> {
    const { data, error } = await this.supabase
      .from('pic_contacts')
      .select('*')
      .ilike('sector_name', `%${sector}%`)
      .single();

    if (error) return null;
    return {
      id: data.id,
      sectorName: data.sector_name,
      picName: data.pic_name,
      whatsappNumber: data.whatsapp_number,
      email: data.email,
      isActive: data.is_active,
    };
  }
}

export class SupabaseCategoryRepository implements ICategoryRepository {
  private supabase = createClient();

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      colorCode: row.color_code,
      description: row.description,
    }));
  }

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        name: cat.name,
        color_code: cat.colorCode,
        description: cat.description,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      colorCode: data.color_code,
      description: data.description,
    };
  }
}

