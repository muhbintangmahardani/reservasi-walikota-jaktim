'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ExternalLink,
  MessageCircle,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Shirt,
  Info,
} from 'lucide-react';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { Reservation } from '../../../domain/entities/Reservation';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeaderRoleConfig {
  id: string;
  label: string;
  keywords: string[];
}

const LEADERSHIP_ROLES: LeaderRoleConfig[] = [
  { id: 'all', label: 'Semua Pimpinan', keywords: [] },
  { id: 'walikota', label: 'Walikota', keywords: ['walikota', 'anwar', 'wali kota', 'wali'] },
  { id: 'wakil', label: 'Wakil Walikota', keywords: ['wakil walikota', 'wawali', 'wakil wali kota', 'wakil'] },
  { id: 'sekko', label: 'Sekko', keywords: ['sekko', 'sekretaris kota', 'sekda', 'sekretaris'] },
  { id: 'aspem', label: 'Aspem', keywords: ['aspem', 'asisten pemerintahan', 'asisten 1', 'fauzi'] },
  { id: 'asekbang', label: 'Asekbang', keywords: ['asekbang', 'perekonomian', 'pembangunan', 'asisten 2'] },
  { id: 'askesra', label: 'Askesra', keywords: ['askesra', 'kesra', 'kesejahteraan', 'asisten 3'] },
];

export const JadwalPimpinanView: React.FC = () => {
  const { reservations, picContacts, isLoading } = useReservations();
  const { allUsers } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'today' | 'week'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disetujui' | 'menunggu'>('all');
  const [selectedAgenda, setSelectedAgenda] = useState<Reservation | null>(null);

  // Filter all reservations that involve leadership (both approved and pending)
  const leadershipAgendas = useMemo(() => {
    return reservations.filter((res) => {
      const executor = (res.executorOfficial || '').toLowerCase();
      const accompanying = (res.accompanyingOfficial || '').toLowerCase();
      const origin = (res.letterOrigin || '').toLowerCase();
      const category = (res.categoryName || '').toLowerCase();
      const event = (res.eventName || '').toLowerCase();
      const room = (res.roomName || '').toLowerCase();
      const userName = (res.userName || '').toLowerCase();
      const userEmail = (res.userEmail || '').toLowerCase();

      // Check if creator is a leader profile
      const creator = allUsers.find(
        (u) => u.id === res.userId || (res.userEmail && u.email?.toLowerCase() === res.userEmail.toLowerCase())
      );
      const isCreatorLeadership =
        creator?.role === 'verifikator_pimpinan' ||
        creator?.role === 'verifikator_asisten' ||
        userEmail.includes('walikota') ||
        userEmail.includes('aspem') ||
        userEmail.includes('sekko');

      // Comprehensive leadership detection across all possible attributes
      const isLeadership =
        isCreatorLeadership ||
        executor.includes('walikota') ||
        executor.includes('wali kota') ||
        executor.includes('wakil') ||
        executor.includes('sekko') ||
        executor.includes('sekretaris') ||
        executor.includes('asisten') ||
        executor.includes('aspem') ||
        executor.includes('asekbang') ||
        executor.includes('askesra') ||
        executor.includes('fauzi') ||
        executor.includes('anwar') ||
        executor.includes('pimpinan') ||
        accompanying.includes('walikota') ||
        accompanying.includes('sekko') ||
        accompanying.includes('asisten') ||
        accompanying.includes('pimpinan') ||
        origin.includes('sekpim') ||
        origin.includes('pimpinan') ||
        origin.includes('walikota') ||
        origin.includes('asisten') ||
        origin.includes('sekretariat') ||
        category.includes('pimpinan') ||
        category.includes('rakor') ||
        category.includes('protokoler') ||
        event.includes('walikota') ||
        event.includes('wali kota') ||
        event.includes('sekko') ||
        event.includes('pimpinan') ||
        event.includes('rapim') ||
        event.includes('audiensi') ||
        room.includes('walikota') ||
        room.includes('wali kota') ||
        room.includes('wakil') ||
        room.includes('sekko') ||
        room.includes('sekretaris') ||
        room.includes('asisten') ||
        room.includes('aspem') ||
        userName.includes('anwar') ||
        userName.includes('walikota') ||
        userName.includes('fauzi') ||
        userName.includes('aspem') ||
        userName.includes('sekko') ||
        userEmail.includes('walikota') ||
        userEmail.includes('aspem') ||
        userEmail.includes('sekko');

      return isLeadership;
    });
  }, [reservations, allUsers]);

  // Sub-filter by chosen leader, time, status, and search
  const filteredAgendas = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return leadershipAgendas.filter((res) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && res.status !== statusFilter) return false;

      // 2. Leader filter
      if (selectedLeader !== 'all') {
        const config = LEADERSHIP_ROLES.find((l) => l.id === selectedLeader);
        if (config && config.keywords.length > 0) {
          const creator = allUsers.find(
            (u) => u.id === res.userId || (res.userEmail && u.email?.toLowerCase() === res.userEmail.toLowerCase())
          );
          const creatorRole = creator?.role;
          const isDirectLeaderRoleMatch =
            (selectedLeader === 'walikota' &&
              (creatorRole === 'verifikator_pimpinan' ||
                res.userEmail?.toLowerCase().includes('walikota') ||
                res.userName?.toLowerCase().includes('anwar') ||
                res.roomName?.toLowerCase().includes('walikota'))) ||
            (selectedLeader === 'aspem' &&
              (creatorRole === 'verifikator_asisten' ||
                res.userEmail?.toLowerCase().includes('aspem') ||
                res.userName?.toLowerCase().includes('fauzi') ||
                res.roomName?.toLowerCase().includes('aspem')));

          const combinedText = `${res.executorOfficial || ''} ${res.accompanyingOfficial || ''} ${res.eventName || ''} ${res.letterOrigin || ''} ${res.roomName || ''} ${res.userName || ''} ${res.userEmail || ''} ${res.categoryName || ''}`.toLowerCase();
          const matches = config.keywords.some((kw) => combinedText.includes(kw));
          if (!matches && !isDirectLeaderRoleMatch) return false;
        }
      }

      // 3. Time filter
      if (timeFilter === 'today' && res.eventDate !== todayStr) return false;
      if (timeFilter === 'upcoming' && res.eventDate < todayStr) return false;
      if (timeFilter === 'week') {
        try {
          const d = parseISO(res.eventDate);
          if (!isThisWeek(d, { weekStartsOn: 1 })) return false;
        } catch {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          res.eventName.toLowerCase().includes(q) ||
          res.roomName.toLowerCase().includes(q) ||
          (res.executorOfficial && res.executorOfficial.toLowerCase().includes(q)) ||
          (res.letterOrigin && res.letterOrigin.toLowerCase().includes(q)) ||
          (res.userName && res.userName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (a.eventDate !== b.eventDate) return a.eventDate.localeCompare(b.eventDate);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [leadershipAgendas, selectedLeader, timeFilter, statusFilter, searchQuery, allUsers]);

  // Metrics summary
  const todayCount = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return leadershipAgendas.filter((r) => r.eventDate === todayStr).length;
  }, [leadershipAgendas]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* SHADCN MINIMALIST HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Jadwal Pimpinan
            </h1>
            <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground border-border">
              View Only
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agenda resmi Walikota, Wakil Walikota, Sekretaris Kota, dan para Asisten untuk koordinasi OPD.
          </p>
        </div>

        {/* Compact summary pill */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-[11px] font-medium">
            <Calendar className="w-3.5 h-3.5 text-foreground" />
            <span className="text-foreground font-semibold">{todayCount}</span> Hari Ini
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
            <span className="text-foreground font-semibold">{leadershipAgendas.length}</span> Total Agenda
          </span>
        </div>
      </div>

      {/* FILTER CONTROLS (SHADCN MINIMALIST TABS) */}
      <div className="space-y-2.5">
        {/* Leader selector pills (Clean scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {LEADERSHIP_ROLES.map((leader) => {
            const isSelected = selectedLeader === leader.id;
            return (
              <button
                key={leader.id}
                type="button"
                onClick={() => setSelectedLeader(leader.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-all border shrink-0',
                  isSelected
                    ? 'bg-foreground text-background font-semibold border-foreground shadow-2xs'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {leader.label}
              </button>
            );
          })}
        </div>

        {/* Sub-filters: Time range + Status + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Segmented Control */}
            <div className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  timeFilter === 'all'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('upcoming')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  timeFilter === 'upcoming'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mendatang
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('today')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  timeFilter === 'today'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('week')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  timeFilter === 'week'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Minggu Ini
              </button>
            </div>

            {/* Status Filter */}
            <div className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  statusFilter === 'all'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('disetujui')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  statusFilter === 'disetujui'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Disetujui
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('menunggu')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-all',
                  statusFilter === 'menunggu'
                    ? 'bg-background text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Menunggu
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari acara, ruangan, pejabat..."
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>
      </div>

      {/* AGENDAS LIST */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredAgendas.length === 0 ? (
          <Card className="border-border/70">
            <CardContent className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Tidak Ada Jadwal Pimpinan</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                {searchQuery || selectedLeader !== 'all' || timeFilter !== 'all'
                  ? 'Tidak ada agenda pimpinan yang sesuai dengan filter atau kata kunci yang dipilih.'
                  : 'Belum ada agenda pimpinan yang terdaftar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAgendas.map((res) => {
            const isApproved = res.status === 'disetujui';
            const isPending = res.status === 'menunggu';

            return (
              <Card
                key={res.id}
                onClick={() => setSelectedAgenda(res)}
                className="border border-border/80 bg-card hover:bg-muted/20 cursor-pointer transition-all hover:shadow-xs overflow-hidden"
              >
                <CardContent className="p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Status & Category row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={isApproved ? 'default' : 'warning'}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {isApproved ? 'Disetujui Resmi' : 'Menunggu Verifikasi Sekpim'}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                        {res.roomName}
                      </span>
                      {res.categoryName && (
                        <Badge variant="outline" className="text-[10px]">
                          {res.categoryName}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-foreground leading-snug">
                      {res.eventName}
                    </h3>

                    {/* Meta info row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>
                          {format(parseISO(res.eventDate), 'dd MMMM yyyy', { locale: localeId })} | {res.startTime} - {res.endTime} WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          Pimpinan: <strong className="text-foreground font-medium">{res.executorOfficial || '-'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          Pengaju: {res.letterOrigin || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Detail button */}
                  <div className="shrink-0 pt-2 md:pt-0 w-full md:w-auto flex justify-end border-t md:border-t-0 border-border/50">
                    <Button variant="outline" size="sm" className="text-xs h-7 px-3">
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL (SHADCN DIALOG) */}
      <Dialog
        isOpen={!!selectedAgenda}
        onClose={() => setSelectedAgenda(null)}
        title={selectedAgenda?.eventName || 'Detail Agenda Pimpinan'}
        description={`Status: ${selectedAgenda?.status === 'disetujui' ? 'DISETUJUI RESMI' : 'MENUNGGU VERIFIKASI SEKPIM'}`}
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
            </div>

            {/* WA PIC Coordination */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Koordinasi Penyesuaian Ruangan via WhatsApp PIC:</span>
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

            <div className="pt-2 flex justify-end">
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
