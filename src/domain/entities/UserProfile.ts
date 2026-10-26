export type UserRole = 
  | 'user_bagian' 
  | 'verifikator_asisten' 
  | 'verifikator_pimpinan' 
  | 'admin';

export type UserType = 'internal' | 'eksternal';

export interface UserProfile {
  id: string;
  fullName: string;
  unitName: string;
  role: UserRole;
  userType: UserType;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

