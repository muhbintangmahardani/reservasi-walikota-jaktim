import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import {
  INotificationRepository,
  IPicContactRepository,
  ICategoryRepository,
} from '../../domain/repositories/INotificationRepository';

import { isSupabaseConfigured } from '../supabase/client';

import { mockRoomRepository } from './MockRoomRepository';
import { mockReservationRepository } from './MockReservationRepository';
import { mockUserRepository } from './MockUserRepository';
import {
  mockNotificationRepository,
  mockPicContactRepository,
  mockCategoryRepository,
} from './MockNotificationRepository';

import { SupabaseRoomRepository } from './SupabaseRoomRepository';
import { SupabaseReservationRepository } from './SupabaseReservationRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import {
  SupabaseNotificationRepository,
  SupabasePicContactRepository,
  SupabaseCategoryRepository,
} from './SupabaseNotificationRepository';

// Singleton instances
const supabaseRoomRepo = new SupabaseRoomRepository();
const supabaseReservationRepo = new SupabaseReservationRepository();
const supabaseUserRepo = new SupabaseUserRepository();
const supabaseNotifRepo = new SupabaseNotificationRepository();
const supabasePicRepo = new SupabasePicContactRepository();
const supabaseCategoryRepo = new SupabaseCategoryRepository();

export const getRoomRepository = (): IRoomRepository => {
  return isSupabaseConfigured() ? supabaseRoomRepo : mockRoomRepository;
};

export const getReservationRepository = (): IReservationRepository => {
  return isSupabaseConfigured() ? supabaseReservationRepo : mockReservationRepository;
};

export const getUserRepository = (): IUserRepository => {
  return isSupabaseConfigured() ? supabaseUserRepo : mockUserRepository;
};

export const getNotificationRepository = (): INotificationRepository => {
  return isSupabaseConfigured() ? supabaseNotifRepo : mockNotificationRepository;
};

export const getPicContactRepository = (): IPicContactRepository => {
  return isSupabaseConfigured() ? supabasePicRepo : mockPicContactRepository;
};

export const getCategoryRepository = (): ICategoryRepository => {
  return isSupabaseConfigured() ? supabaseCategoryRepo : mockCategoryRepository;
};

