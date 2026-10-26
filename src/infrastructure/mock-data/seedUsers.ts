import { UserProfile } from '../../domain/entities/UserProfile';
import { Category, PicContact } from '../../domain/entities/Category';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    fullName: 'Budi Setiawan',
    unitName: 'Bagian Pemerintahan',
    role: 'user_bagian',
    userType: 'internal',
    email: 'budi@jakarta.go.id',
    phoneNumber: '081234567890',
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    fullName: 'Drs. H. Ahmad Fauzi, M.Si',
    unitName: 'Asisten Pemerintahan (Aspem)',
    role: 'verifikator_asisten',
    userType: 'internal',
    email: 'aspem@jakarta.go.id',
    phoneNumber: '081398765432',
    isActive: true,
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    fullName: 'M. Anwar, S.Si, M.AP',
    unitName: 'Walikota Kota Administrasi Jakarta Timur',
    role: 'verifikator_pimpinan',
    userType: 'internal',
    email: 'walikota@jakarta.go.id',
    phoneNumber: '081122334455',
    isActive: true,
    createdAt: '2026-01-02T08:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    fullName: 'Siti Rahmawati, S.Kom',
    unitName: 'Suku Dinas Kominfotik Jakarta Timur',
    role: 'admin',
    userType: 'internal',
    email: 'admin.kominfotik@jakarta.go.id',
    phoneNumber: '081987654321',
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    fullName: 'Siti Rahmawati, S.Sos',
    unitName: 'Bagian Kesejahteraan Rakyat (Kesra)',
    role: 'user_bagian',
    userType: 'internal',
    email: 'siti.kesra@jakarta.go.id',
    phoneNumber: '081277889900',
    isActive: true,
    createdAt: '2026-01-11T09:00:00Z',
  },
  {
    id: 'user-external-1',
    fullName: 'Bambang Sudarmono',
    unitName: 'Badan Amil Zakat Nasional (BAZNAS BAZIS Jaktim)',
    role: 'user_bagian',
    userType: 'eksternal',
    email: 'kontak@baznasjaktim.or.id',
    phoneNumber: '085711223344',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Rakor Pimpinan Tingkat Kota', colorCode: '#1e40af', description: 'Rapat pimpinan Walikota, Wakil Walikota, dan Sekko' },
  { id: 'cat-2', name: 'Evaluasi Kinerja & Serapan Anggaran', colorCode: '#b45309', description: 'Monitoring program dan evaluasi UKPD' },
  { id: 'cat-3', name: 'Sosialisasi & Workshop Teknis', colorCode: '#047857', description: 'Pelatihan teknis aparatur atau bimtek' },
  { id: 'cat-4', name: 'Audiensi Publik & Komunitas', colorCode: '#6d28d9', description: 'Penerimaan aspirasi masyarakat dan ormas' },
  { id: 'cat-5', name: 'Protokoler & Kedinasan Khusus', colorCode: '#be123c', description: 'Kunjungan kerja Kementerian / Gubernur' },
  { id: 'cat-6', name: 'Rapat Koordinasi Wilayah', colorCode: '#0e7490', description: 'Koordinasi Camat dan Lurah' },
];

export const INITIAL_PIC_CONTACTS: PicContact[] = [
  {
    id: 'pic-1',
    sectorName: 'Pemerintahan',
    picName: 'Ibu Hendriani (Subbag Tata Pemerintahan)',
    whatsappNumber: '6281298765432',
    email: 'subbag.pem.jaktim@jakarta.go.id',
    isActive: true,
  },
  {
    id: 'pic-2',
    sectorName: 'Kesejahteraan Rakyat (Kesra)',
    picName: 'Bpk. Rizky Ramadhan (Subbag Kesra)',
    whatsappNumber: '6281312345678',
    email: 'subbag.kesra.jaktim@jakarta.go.id',
    isActive: true,
  },
  {
    id: 'pic-3',
    sectorName: 'Perekonomian & Pembangunan (Ekbang)',
    picName: 'Ibu Dian Safitri (Subbag Perekonomian)',
    whatsappNumber: '6281987654321',
    email: 'subbag.ekbang.jaktim@jakarta.go.id',
    isActive: true,
  },
];

