export interface Category {
  id: string;
  name: string;
  colorCode: string;
  description?: string;
}

export interface PicContact {
  id: string;
  sectorName: 'Pemerintahan' | 'Kesejahteraan Rakyat (Kesra)' | 'Perekonomian & Pembangunan (Ekbang)';
  picName: string;
  whatsappNumber: string; // international format e.g. "628123456789"
  email?: string;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  recipientId: string; // or 'all'
  reservationId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

