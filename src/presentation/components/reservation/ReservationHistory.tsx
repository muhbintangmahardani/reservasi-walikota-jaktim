'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarPlus,
  Clock,
  MapPin,
  Trash2,
  MessageCircle,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Reservation } from '../../../domain/entities/Reservation';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export const ReservationHistory: React.FC = () => {
  const { reservations, deleteReservation, picContacts, isLoading } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPicModal, setSelectedPicModal] = useState<Reservation | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'menunggu' | 'disetujui' | 'ditolak'>('all');

  const isNormalUser = currentUser?.role === 'user_bagian';

  // Flexible and reliable user reservation matching
  const scopedReservations = useMemo(() => {
    if (!isNormalUser || scopeFilter === 'all') {
      return reservations;
    }

    return reservations.filter((r) => {
      // 1. Direct ID match
      if (currentUser?.id && r.userId === currentUser.id) return true;
      // 2. Email match
      if (currentUser?.email && r.userEmail && r.userEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      // 3. Name match
      if (currentUser?.fullName && r.userName && r.userName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
      // 4. Department / Unit match
      if (currentUser?.unitName && r.letterOrigin && r.letterOrigin.toLowerCase().includes(currentUser.unitName.toLowerCase())) return true;
      // 5. Common default ID for internal submissions
      if (r.userId === '30000000-0000-0000-0000-000000000001') return true;

      return false;
    });
  }, [reservations, isNormalUser, scopeFilter, currentUser]);

  // Apply search & status filter
  const filteredReservations = useMemo(() => {
    return scopedReservations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.eventName.toLowerCase().includes(q) ||
          item.roomName.toLowerCase().includes(q) ||
          (item.executorOfficial && item.executorOfficial.toLowerCase().includes(q)) ||
          (item.letterOrigin && item.letterOrigin.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [scopedReservations, statusFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    if (confirm('Batalkan dan hapus pengajuan reservasi ini?')) {
      setDeletingId(id);
      try {
        await deleteReservation(id);
        toast({
          title: 'Reservasi Berhasil Dibatalkan',
          description: 'Pengajuan reservasi ruangan telah dihapus dari sistem.',
          variant: 'destructive',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal membatalkan reservasi';
        toast({
          title: 'Gagal Membatalkan',
          description: msg,
          variant: 'destructive',
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Riwayat Pengajuan Reservasi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar permohonan peminjaman ruangan dan status persetujuan dari Sekretariat Pimpinan.
          </p>
        </div>
        <Link href="/reservasi/baru">
          <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Reservasi Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar (Shadcn UI Minimalist Style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Scope and Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {isNormalUser && (
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setScopeFilter('my')}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all',
                  scopeFilter === 'my'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Pengajuan Saya
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all',
                  scopeFilter === 'all'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semua Instansi ({reservations.length})
              </button>
            </div>
          )}

          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('menunggu')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                statusFilter === 'menunggu'
                  ? 'bg-background text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Menunggu
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disetujui')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                statusFilter === 'disetujui'
                  ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Disetujui
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ditolak')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                statusFilter === 'ditolak'
                  ? 'bg-background text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Ditolak
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari acara, ruangan, pejabat..."
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-3 border-border/70">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredReservations.length === 0 ? (
          <Card className="border-border/70">
            <CardContent className="py-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Tidak Ada Data Pengajuan</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada pengajuan yang cocok dengan kriteria pencarian atau filter status ini.'
                  : 'Belum ada agenda reservasi yang tercatat untuk akun Anda.'}
              </p>
              <div className="pt-2">
                <Link href="/reservasi/baru">
                  <Button variant="outline" size="sm" className="text-xs">
                    Buat Pengajuan Baru
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((item) => {
            const isPending = item.status === 'menunggu';
            const isApproved = item.status === 'disetujui';

            return (
              <Card
                key={item.id}
                className={cn(
                  'border transition-colors hover:border-border overflow-hidden',
                  isApproved
                    ? 'border-l-4 border-l-emerald-500'
                    : isPending
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-rose-500'
                )}
              >
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          isApproved ? 'default' : isPending ? 'warning' : 'destructive'
                        }
                        className="text-[10px] capitalize px-2 py-0.5"
                      >
                        {item.status === 'menunggu' ? 'Menunggu Verifikasi Sekpim' : item.status}
                      </Badge>
                      <span className="text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                        {item.roomName}
                      </span>
                      {item.categoryName && (
                        <Badge variant="outline" className="text-[10px]">
                          {item.categoryName}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm text-foreground leading-snug">
                      {item.eventName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>
                          {format(parseISO(item.eventDate), 'dd MMMM yyyy', { locale: localeId })} | {item.startTime} - {item.endTime} WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{item.roomName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          Pelaksana: <strong className="text-foreground font-medium">{item.executorOfficial || '-'}</strong>
                        </span>
                      </div>
                    </div>

                    {item.letterOrigin && (
                      <div className="text-[10px] text-muted-foreground">
                        Asal Pengaju: <span className="font-medium text-foreground">{item.letterOrigin}</span>
                      </div>
                    )}

                    {item.rejectionReason && (
                      <div className="p-2.5 rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-[11px] text-rose-800 dark:text-rose-200">
                        <span className="font-semibold">Catatan Sekpim: </span>
                        {item.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    {isPending ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        className="text-xs h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        <span>{deletingId === item.id ? 'Menghapus...' : 'Batalkan'}</span>
                      </Button>
                    ) : isApproved ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPicModal(item)}
                        className="text-xs h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <MessageCircle className="w-3 h-3 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Koordinasi PIC</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Arsip Selesai</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL PIC WA */}
      <Dialog
        isOpen={!!selectedPicModal}
        onClose={() => setSelectedPicModal(null)}
        title="Koordinasi Perubahan Jadwal Terverifikasi"
        description="Sesuai protokoler, reservasi yang telah disetujui hanya dapat disesuaikan melalui koordinasi PIC Bidang."
      >
        {selectedPicModal && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-muted/40 border border-border/60">
              <p className="font-semibold text-foreground">{selectedPicModal.eventName}</p>
              <p className="text-muted-foreground">{selectedPicModal.roomName} • {selectedPicModal.eventDate}</p>
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-foreground block">Pilih Kontak WhatsApp PIC:</span>
              {picContacts.map((pic) => (
                <a
                  key={pic.id}
                  href={`https://wa.me/${pic.whatsappNumber}?text=Halo%20${encodeURIComponent(pic.picName)},%20saya%20dari%20${encodeURIComponent(currentUser?.unitName || 'OPD')}%20ingin%20koordinasi%20perubahan%20jadwal:%20${encodeURIComponent(selectedPicModal.eventName)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground text-xs">Bidang {pic.sectorName}</p>
                    <p className="text-muted-foreground text-[10px]">{pic.picName}</p>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    Buka WhatsApp <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPicModal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
