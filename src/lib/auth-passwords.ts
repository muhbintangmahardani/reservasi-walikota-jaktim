import { getWIBISOString } from './wib-time';

const PASSWORDS_STORAGE_KEY = 'e_reservasi_user_passwords_v1';
const RESET_REQUESTS_STORAGE_KEY = 'e_reservasi_password_resets_v1';

export interface PasswordResetRequest {
  email: string;
  requestedAt: string;
  status: 'pending' | 'resolved';
}

export const OFFICIAL_DEFAULT_PASSWORDS: Record<string, string> = {
  'budi@jakarta.go.id': 'walikota2026',
  'aspem@jakarta.go.id': 'walikota2026',
  'walikota@jakarta.go.id': 'walikota2026',
  'admin.kominfotik@jakarta.go.id': 'walikota2026',
};

/**
 * Mendapatkan kata sandi akun berdasarkan email (default: walikota2026)
 */
export const getUserPassword = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  if (typeof window === 'undefined') {
    return OFFICIAL_DEFAULT_PASSWORDS[normalized] || 'walikota2026';
  }

  try {
    const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (stored) {
      const map: Record<string, string> = JSON.parse(stored);
      if (map[normalized]) return map[normalized];
    }
  } catch (e) {
    console.error('Error reading user passwords from storage', e);
  }

  return OFFICIAL_DEFAULT_PASSWORDS[normalized] || 'walikota2026';
};

/**
 * Menyimpan / memperbarui kata sandi pengguna
 */
export const setUserPassword = (email: string, newPass: string): void => {
  const normalized = email.trim().toLowerCase();
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    const map: Record<string, string> = stored ? JSON.parse(stored) : {};
    map[normalized] = newPass;
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving user password to storage', e);
  }
};

/**
 * Mendaftarkan permintaan reset kata sandi baru (dari formulir Lupa Sandi)
 */
export const recordPasswordResetRequest = (email: string): PasswordResetRequest => {
  const normalized = email.trim().toLowerCase();
  const request: PasswordResetRequest = {
    email: normalized,
    requestedAt: getWIBISOString(),
    status: 'pending',
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(RESET_REQUESTS_STORAGE_KEY);
      const list: PasswordResetRequest[] = stored ? JSON.parse(stored) : [];
      // Hapus permohonan lama untuk email yang sama jika masih pending
      const filtered = list.filter((r) => r.email !== normalized);
      filtered.unshift(request);
      localStorage.setItem(RESET_REQUESTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error storing password reset request', e);
    }
  }

  return request;
};

/**
 * Mengambil daftar permintaan reset sandi yang berstatus pending (untuk Admin)
 */
export const getPendingPasswordResetRequests = (): PasswordResetRequest[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RESET_REQUESTS_STORAGE_KEY);
    if (!stored) return [];
    const list: PasswordResetRequest[] = JSON.parse(stored);
    return list.filter((r) => r.status === 'pending');
  } catch (e) {
    console.error('Error reading password reset requests', e);
    return [];
  }
};

/**
 * Menyelesaikan permintaan reset sandi oleh Admin
 */
export const resolvePasswordResetRequest = (email: string, newPassword?: string): void => {
  const normalized = email.trim().toLowerCase();
  if (newPassword) {
    setUserPassword(normalized, newPassword);
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(RESET_REQUESTS_STORAGE_KEY);
      if (stored) {
        const list: PasswordResetRequest[] = JSON.parse(stored);
        const updated = list.map((r) =>
          r.email === normalized ? { ...r, status: 'resolved' as const } : r
        );
        localStorage.setItem(RESET_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Error resolving password reset request', e);
    }
  }
};

