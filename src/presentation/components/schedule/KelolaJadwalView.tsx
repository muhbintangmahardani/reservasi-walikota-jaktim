'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Building,
  Search,
  Filter,
  Edit,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  MessageCircle,
  FileText,
  Eye,
  ShieldCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Reservation } from '../../../domain/entities/Reservation';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export const KelolaJadwalView: React.FC = () => {
  const router = useRouter();
  const { reservations, rooms, categories, picContacts, isLoading } = useReservations();
  const { currentUser } = useAuth();

  const isPimpinan = currentUser?.role === 'verifikator_pimpinan';
  const isAsisten = currentUser?.role === 'verifikator_asisten';
  const isAdmin = currentUser?.role === 'admin';
  const canManage = isPimpinan || isAsisten || isAdmin;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disetujui' | 'menunggu' | 'ditolak'>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'upcoming' | 'week' | 'month'>('all');
  const [selectedAgenda, setSelectedAgenda] = useState<Reservation | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roomFilter, timeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayCount = reservations.filter((r) => r.eventDate === todayStr).length;
    const pendingCount = reservations.filter((r) => r.status === 'menunggu').length;
    const approvedCount = reservations.filter((r) => r.status === 'disetujui').length;
    const totalCount = reservations.length;
    return { todayCount, pendingCount, approvedCount, totalCount };
  }, [reservations]);

  // Filtered List
  const filteredReservations = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return reservations
      .filter((res) => {
        // Status filter
        if (statusFilter !== 'all' && res.status !== statusFilter) return false;

        // Room filter
        if (roomFilter !== 'all' && res.roomId !== roomFilter) return false;

        // Time filter
        if (timeFilter === 'today' && res.eventDate !== todayStr) return false;
        if (timeFilter === 'upcoming' && res.eventDate < todayStr) return false;
        if (timeFilter === 'week') {
          try {
            if (!isThisWeek(parseISO(res.eventDate), { weekStartsOn: 1 })) return false;
          } catch {
            return false;
          }
        }
        if (timeFilter === 'month') {
          try {
            if (!isThisMonth(parseISO(res.eventDate))) return false;
          } catch {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            res.eventName.toLowerCase().includes(q) ||
            res.roomName.toLowerCase().includes(q) ||
            (res.executorOfficial && res.executorOfficial.toLowerCase().includes(q)) ||
            (res.accompanyingOfficial && res.accompanyingOfficial.toLowerCase().includes(q)) ||
            (res.letterOrigin && res.letterOrigin.toLowerCase().includes(q)) ||
            (res.userName && res.userName.toLowerCase().includes(q)) ||
            (res.categoryName && res.categoryName.toLowerCase().includes(q));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort upcoming first, then by date descending
        if (a.eventDate !== b.eventDate) return b.eventDate.localeCompare(a.eventDate);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [reservations, statusFilter, roomFilter, timeFilter, searchQuery]);

  // Total pages and paginated slice
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE) || 1;
  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  // Guard for unauthorized roles
  if (!canManage) {
    return (
      <div className="w-full py-12">
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Akses Khusus Verifikator & Pimpinan</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Halaman kelola jadwal hanya dapat diakses oleh role Pimpinan, Asisten, atau Administrator.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'disetujui':
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        );
      case 'menunggu':
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </Badge>
        );
      case 'ditolak':
        return (
          <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. HEADER (Shadcn Clean Minimalist) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Kelola Jadwal Kegiatan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pusat kendali dan penyesuaian seluruh agenda rapat pimpinan dan kegiatan ruang rapat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/jadwal-pimpinan')}
            className="text-xs h-8"
          >
            Portal Jadwal Pimpinan
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/reservasi/baru')}
            className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Buat Reservasi Baru
          </Button>
        </div>
      </div>

      {/* 2. METRICS CARDS (FULL WIDTH 4-GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Jadwal Terdaftar</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted text-foreground">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Jadwal Hari Ini</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.todayCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{metrics.pendingCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Agenda Disetujui</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.approvedCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kegiatan, pimpinan pelaksana, ruangan, atau OPD..."
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Ruangan Filter */}
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Rentang Waktu */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Tanggal</option>
                <option value="today">Hari Ini</option>
                <option value="upcoming">Mendatang</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/50 text-xs">
            <span className="text-[11px] font-medium text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {(['all', 'disetujui', 'menunggu', 'ditolak'] as const).map((st) => {
              const label =
                st === 'all'
                  ? 'Semua Status'
                  : st === 'disetujui'
                  ? 'Disetujui'
                  : st === 'menunggu'
                  ? 'Menunggu'
                  : 'Ditolak';
              const count =
                st === 'all'
                  ? reservations.length
                  : reservations.filter((r) => r.status === st).length;
              const isSelected = statusFilter === st;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all border shrink-0',
                    isSelected
                      ? 'bg-foreground text-background font-semibold border-foreground shadow-2xs'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. DATA TABLE (DESKTOP & TABLET) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daftar Jadwal Kegiatan ({filteredReservations.length})
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal">
            Klik tombol &quot;Edit Jadwal&quot; untuk memperbarui rincian kegiatan
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CalendarClock className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">Tidak Ada Jadwal Ditemukan</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tidak ada agenda yang cocok dengan kata kunci pencarian atau filter yang Anda terapkan.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoomFilter('all');
                  setTimeFilter('all');
                }}
                className="text-xs h-7"
              >
                Reset Semua Filter
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/30">
                    <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
                    <TableHead className="min-w-[280px] text-xs font-semibold">Nama Acara & Kategori</TableHead>
                    <TableHead className="min-w-[150px] text-xs font-semibold whitespace-nowrap">Hari & Waktu</TableHead>
                    <TableHead className="min-w-[160px] text-xs font-semibold">Ruangan</TableHead>
                    <TableHead className="min-w-[160px] text-xs font-semibold">Pejabat Pelaksana</TableHead>
                    <TableHead className="min-w-[140px] text-xs font-semibold">Asal OPD</TableHead>
                    <TableHead className="w-28 text-center text-xs font-semibold whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-32 text-right pr-4 text-xs font-semibold whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReservations.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="text-xs min-w-[280px]">
                        <div className="font-semibold text-foreground leading-normal" title={item.eventName}>
                          {item.eventName}
                        </div>
                        {item.categoryName && (
                          <div className="mt-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                              {item.categoryName}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {format(parseISO(item.eventDate), 'dd MMM yyyy', { locale: localeId })}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.startTime} - {item.endTime} WIB</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[160px]">{item.roomName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground truncate max-w-[160px]">
                          {item.executorOfficial || '-'}
                        </div>
                        {item.accompanyingOfficial && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                            Pendamping: {item.accompanyingOfficial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="text-foreground truncate max-w-[140px]">{item.letterOrigin || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-xs text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Edit Jadwal Langsung */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/reservasi/edit/${item.id}`)}
                            className="h-7 px-2.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                            title="Edit Jadwal & Penyesuaian Agenda"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Jadwal
                          </Button>

                          {/* Tombol Lihat Detail Modal */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAgenda(item)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title="Lihat Rincian Agenda"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 5. PAGINATION TOOLBAR */}
          {filteredReservations.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border/70 text-xs text-muted-foreground bg-card">
              <div>
                Menampilkan{' '}
                <span className="font-semibold text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                -{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-foreground">{filteredReservations.length}</span>{' '}
                agenda kegiatan
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2.5 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === p ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                'h-7 w-7 p-0 text-xs font-medium',
                                currentPage === p && 'pointer-events-none'
                              )}
                            >
                              {p}
                            </Button>
                          </React.Fragment>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2.5 text-xs"
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. MODAL DETAIL AGENDA */}
      <Dialog
        isOpen={!!selectedAgenda}
        onClose={() => setSelectedAgenda(null)}
        title={selectedAgenda?.eventName || 'Detail Kegiatan'}
        description={`Status: ${selectedAgenda?.status === 'disetujui' ? 'DISETUJUI RESMI' : selectedAgenda?.status === 'menunggu' ? 'MENUNGGU VERIFIKASI SEKPIM' : 'DITOLAK'}`}
      >
        {selectedAgenda && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div>
                <span className="text-muted-foreground block text-[10px]">Hari & Tanggal</span>
                <span className="font-medium text-foreground">
                  {format(parseISO(selectedAgenda.eventDate), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Waktu Pelaksanaan</span>
                <span className="font-medium text-foreground">
                  {selectedAgenda.startTime} - {selectedAgenda.endTime} WIB
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Tempat / Ruangan:</span>
                <span className="font-medium text-foreground">{selectedAgenda.roomName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pimpinan Rapat:</span>
                <span className="font-semibold text-foreground">{selectedAgenda.executorOfficial || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pejabat Pendamping:</span>
                <span className="font-medium text-foreground">{selectedAgenda.accompanyingOfficial || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pakaian (Dress Code):</span>
                <span className="font-medium text-foreground">{selectedAgenda.dressCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Asal Surat / OPD:</span>
                <span className="font-medium text-foreground">{selectedAgenda.letterOrigin || '-'}</span>
              </div>
              {selectedAgenda.categoryName && (
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Label Kategori:</span>
                  <span className="font-medium text-foreground">{selectedAgenda.categoryName}</span>
                </div>
              )}
            </div>

            {/* WA PIC Coordination */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Kontak PIC Ruangan (WhatsApp):</span>
              </div>
              <div className="space-y-1.5">
                {picContacts.map((pic) => (
                  <a
                    key={pic.id}
                    href={`https://wa.me/${pic.whatsappNumber}?text=Halo%20${encodeURIComponent(pic.picName)},%20saya%20ingin%20koordinasi%20mengenai%20jadwal%20${encodeURIComponent(selectedAgenda.eventName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 text-[11px] font-medium transition-colors"
                  >
                    <span>Bidang {pic.sectorName} ({pic.picName})</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      Chat WA <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="default"
                size="sm"
                className="text-xs h-8 px-3 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  const agendaId = selectedAgenda.id;
                  setSelectedAgenda(null);
                  router.push(`/reservasi/edit/${agendaId}`);
                }}
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Buka Halaman Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedAgenda(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

