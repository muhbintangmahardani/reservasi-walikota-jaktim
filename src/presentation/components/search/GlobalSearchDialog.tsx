'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Users,
  Settings,
  CheckCircle2,
  X,
  MapPin,
  CalendarPlus,
  History,
  LayoutDashboard,
  Crown,
  CalendarClock,
} from 'lucide-react';
import { useReservations } from '../../context/ReservationContext';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { reservations, rooms } = useReservations();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search in reservations
  const matchedReservations = trimmed
    ? reservations.filter(
        (r) =>
          r.eventName.toLowerCase().includes(trimmed) ||
          r.roomName.toLowerCase().includes(trimmed) ||
          r.userName.toLowerCase().includes(trimmed) ||
          r.letterOrigin.toLowerCase().includes(trimmed) ||
          (r.categoryName && r.categoryName.toLowerCase().includes(trimmed)) ||
          r.eventDate.includes(trimmed)
      ).slice(0, 6)
    : [];

  // Search in rooms
  const matchedRooms = trimmed
    ? rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(trimmed) ||
          room.buildingFloor.toLowerCase().includes(trimmed) ||
          room.facilities.some((f) => f.toLowerCase().includes(trimmed)) ||
          `kapasitas ${room.capacity}`.includes(trimmed)
      ).slice(0, 4)
    : [];

  // Search in app navigation menus
  const navItems = [
    { label: 'Dashboard Utama', href: '/dashboard', icon: LayoutDashboard, category: 'Menu' },
    { label: 'Kalender Jadwal Interaktif', href: '/kalender', icon: Calendar, category: 'Menu' },
    { label: 'Jadwal Pimpinan & Agenda Walikota', href: '/jadwal-pimpinan', icon: Crown, category: 'Menu' },
    { label: 'Form Pengajuan Reservasi Baru', href: '/reservasi/baru', icon: CalendarPlus, category: 'Menu' },
    { label: 'Riwayat Pengajuan Reservasi', href: '/reservasi/riwayat', icon: History, category: 'Menu' },
    { label: 'Meja Verifikasi Sekpim (Asisten & Pimpinan)', href: '/verifikasi', icon: CheckCircle2, category: 'Sekpim' },
    { label: 'Kelola Jadwal & Penyesuaian Agenda', href: '/kelola-jadwal', icon: CalendarClock, category: 'Sekpim' },
    { label: 'Data & Manajemen Ruangan', href: '/ruangan', icon: Building2, category: 'Fasilitas' },
    { label: 'Laporan Rekapitulasi & Ekspor Data', href: '/laporan', icon: FileSpreadsheet, category: 'Laporan' },
    { label: 'Manajemen Pengguna (Admin Kominfotik)', href: '/pengaturan/users', icon: Users, category: 'Admin' },
    { label: 'Pengaturan Akun & Profil', href: '/pengaturan', icon: Settings, category: 'Pengaturan' },
  ];

  const matchedMenus = trimmed
    ? navItems.filter((m) => m.label.toLowerCase().includes(trimmed))
    : navItems.slice(0, 4);

  const hasResults = matchedReservations.length > 0 || matchedRooms.length > 0 || matchedMenus.length > 0;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar - Spacious, clean and borderless */}
        <div className="flex items-center px-5 border-b border-border/60 h-14 gap-3 bg-card">
          <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik kata kunci (contoh: ruang pola, rapat anggaran, serapan, camat)..."
            className="flex-1 w-full bg-transparent border-0 outline-hidden focus:outline-hidden focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground font-normal p-0 shadow-none"
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border border-border bg-muted/60 font-mono text-[10px] font-medium text-muted-foreground select-none shrink-0 ml-1">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!trimmed && (
            <div className="py-2 px-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Pintasan Menu Cepat
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {navItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {trimmed && !hasResults && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-muted-foreground">
                Tidak ada agenda, ruangan, atau menu yang cocok dengan kata kunci &quot;{query}&quot;.
              </p>
            </div>
          )}

          {/* Section 1: Agenda & Reservasi Rapat */}
          {matchedReservations.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Agenda Rapat ({matchedReservations.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Klik untuk lihat riwayat</span>
              </div>
              <div className="space-y-1">
                {matchedReservations.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelect('/reservasi/riwayat')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-muted/60 transition-colors group border border-transparent hover:border-border/60"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {res.eventName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {res.roomName} &bull; {res.userName} ({res.letterOrigin})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {format(parseISO(res.eventDate), 'dd MMM yyyy', { locale: localeId })}
                      </div>
                      <Badge
                        variant={
                          res.status === 'disetujui'
                            ? 'success'
                            : res.status === 'menunggu'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[9px] uppercase px-1.5 py-0 mt-0.5"
                      >
                        {res.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Ruangan & Fasilitas */}
          {matchedRooms.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Ruangan Rapat ({matchedRooms.length})
                </span>
              </div>
              <div className="space-y-1">
                {matchedRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleSelect('/ruangan')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-muted/60 transition-colors group border border-transparent hover:border-border/60"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {room.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {room.buildingFloor} &bull; Kapasitas {room.capacity} orang
                        </p>
                      </div>
                    </div>
                    <Badge variant={room.isActive ? 'neutral' : 'outline'} className="text-[10px]">
                      {room.isActive ? 'Siap Digunakan' : 'Nonaktif'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Menu Navigasi yang Cocok */}
          {trimmed && matchedMenus.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block px-1 mb-1.5">
                Menu & Halaman ({matchedMenus.length})
              </span>
              <div className="space-y-1">
                {matchedMenus.map((menu) => {
                  const Icon = menu.icon;
                  return (
                    <button
                      key={menu.href}
                      onClick={() => handleSelect(menu.href)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-muted/60 transition-colors text-xs font-medium text-foreground"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{menu.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-border/60 bg-muted/30 px-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tekan <b>ESC</b> untuk menutup</span>
          <span>Sistem Informasi E-Reservasi Walikota Jakarta Timur</span>
        </div>
      </div>
    </div>
  );
};

