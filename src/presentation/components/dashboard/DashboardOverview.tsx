'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle2,
  Building2,
  TrendingUp,
  Download,
  FileSpreadsheet,
  ArrowRight,
  User,
  MapPin,
  Bell,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export const DashboardOverview: React.FC = () => {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { reservations, rooms, activeRooms, notifications, isLoading } = useReservations();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'rooms' | 'notifications'>('overview');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'unauthorized_verifikator') {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki wewenang untuk membuka Meja Verifikasi Sekpim.',
        variant: 'destructive',
      });
    } else if (err === 'unauthorized_admin') {
      toast({
        title: 'Akses Ditolak',
        description: 'Halaman Kelola Pengguna hanya diperuntukkan bagi Admin Kominfotik.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const totalReservations = reservations.length;
  const approvedReservations = reservations.filter((r) => r.status === 'disetujui');
  const approvedToday = reservations.filter((r) => r.eventDate === todayStr && r.status === 'disetujui');
  const pendingReservations = reservations.filter((r) => r.status === 'menunggu');
  const totalActiveRooms = activeRooms.length;

  const approvalRate = totalReservations > 0
    ? Math.round((approvedReservations.length / totalReservations) * 100)
    : 0;

  const todaySchedules = approvedToday.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const recentReservations = reservations.slice(0, 5);

  // Dynamic Monthly Room Booking Volume derived 100% from live Supabase reservations
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const monthlyCounts = React.useMemo(() => {
    const counts = new Array(12).fill(0);
    reservations.forEach((r) => {
      if (!r.eventDate) return;
      const parts = r.eventDate.split('-');
      if (parts.length >= 2) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          counts[monthIdx] += 1;
        }
      }
    });
    return counts;
  }, [reservations]);

  const maxMonthCount = Math.max(...monthlyCounts, 0);
  const peakScale = Math.max(Math.ceil((maxMonthCount > 0 ? maxMonthCount : 5) / 5) * 5, 5);

  const monthlyData = monthLabels.map((month, idx) => {
    const count = monthlyCounts[idx];
    const heightPercent = maxMonthCount > 0 && count > 0
      ? Math.max(Math.round((count / peakScale) * 90), 8)
      : 4;
    return {
      month,
      count,
      height: `${heightPercent}%`,
    };
  });

  const peakMonthIndex = monthlyCounts.indexOf(maxMonthCount);
  const peakMonthName = monthLabels[peakMonthIndex] || 'Okt';
  const averageMonthly = (reservations.length / 12).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Header matching Shadcn Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sistem Informasi Penjadwalan & Reservasi Ruang Rapat Kantor Walikota Jakarta Timur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/laporan">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Ekspor Data</span>
            </Button>
          </Link>
          <Link href="/reservasi/baru">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Reservasi Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Sub-navigation Tabs matching Shadcn Admin Screenshot */}
      <div className="overflow-x-auto pb-1 max-w-full">
        <div className="inline-flex h-9 items-center rounded-lg bg-muted/60 p-1 text-muted-foreground shrink-0 min-w-max">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all",
              activeTab === 'overview'
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all",
              activeTab === 'today'
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "hover:text-foreground"
            )}
          >
            Jadwal Hari Ini ({approvedToday.length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all",
              activeTab === 'rooms'
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "hover:text-foreground"
            )}
          >
            Statistik Ruangan
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all",
              activeTab === 'notifications'
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "hover:text-foreground"
            )}
          >
            Notifikasi Sistem
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Matching Shadcn Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* Card 1: Total Reservasi */}
            <Card className="hover:border-border transition-colors">
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-medium text-muted-foreground">Total Reservasi</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-2xl font-bold tracking-tight text-foreground">{totalReservations}</div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-emerald-600 font-semibold">{approvalRate}% disetujui</span>
                  <span>({approvedReservations.length} agenda resmi)</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Menunggu Verifikasi */}
            <Card className="hover:border-border transition-colors">
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-medium text-muted-foreground">Menunggu Verifikasi</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {pendingReservations.length}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {pendingReservations.length > 0
                    ? `${pendingReservations.length} permohonan butuh verifikasi`
                    : 'Semua permohonan telah diproses'}
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Reservasi Aktif Hari Ini */}
            <Card className="hover:border-border transition-colors">
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-medium text-muted-foreground">Jadwal Rapat Hari Ini</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {approvedToday.length}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {approvedToday.length > 0
                    ? `${approvedToday.length} agenda terkonfirmasi hari ini`
                    : 'Tidak ada agenda rapat hari ini'}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Ruangan Operasional */}
            <Card className="hover:border-border transition-colors">
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-medium text-muted-foreground">Ruangan Operasional</span>
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {totalActiveRooms} <span className="text-sm font-normal text-muted-foreground">/ {rooms.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {rooms.length > 0
                    ? `${Math.round((totalActiveRooms / rooms.length) * 100)}% kapasitas siap pakai`
                    : 'Memuat data ruangan...'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* SKELETON FOR CHARTS & LIST WHEN LOADING */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
          {/* Left Bar Chart Card Skeleton */}
          <Card className="lg:col-span-4 p-5 space-y-4 border border-border/70">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex h-64 w-full gap-3 pt-6 pb-2">
              {/* Y-axis Ticks Skeleton */}
              <div className="flex flex-col justify-between py-1 w-6 shrink-0">
                <Skeleton className="h-2.5 w-4" />
                <Skeleton className="h-2.5 w-4" />
                <Skeleton className="h-2.5 w-4" />
                <Skeleton className="h-2.5 w-4" />
                <Skeleton className="h-2.5 w-3" />
              </div>
              {/* 12 Vertical Bars Skeleton */}
              <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b border-border/60">
                {[45, 65, 80, 55, 40, 70, 35, 75, 68, 90, 78, 30].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                    <Skeleton className="w-full max-w-[26px] rounded-t-sm" style={{ height: `${val}%` }} />
                    <Skeleton className="h-2.5 w-5 rounded-xs" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </Card>

          {/* Right Recent Reservations List Skeleton */}
          <Card className="lg:col-span-3 p-5 space-y-4 border border-border/70">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
            <div className="space-y-4 pt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Skeleton className="h-3 w-10 font-mono" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 1: OVERVIEW (Matching exact screenshot layout: Left Bar Chart + Right Recent List) */}
      {!isLoading && activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
          {/* LEFT: Overview Bar Chart (4/7 columns) */}
          <Card className="lg:col-span-4 flex flex-col justify-between">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold">Overview Pemanfaatan Ruangan</CardTitle>
              <CardDescription className="text-xs">
                Volume peminjaman ruang rapat Kantor Walikota Jakarta Timur per bulan.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-end">
              {/* Bar Chart Area (Styled matching Shadcn Admin) */}
              <div className="flex h-64 w-full gap-3 pt-6 pb-2">
                {/* Left Y-axis ticks */}
                <div className="flex flex-col justify-between text-[10px] text-muted-foreground font-mono shrink-0 py-1 text-right w-6 select-none">
                  <span>{peakScale}</span>
                  <span>{Math.round(peakScale * 0.75)}</span>
                  <span>{Math.round(peakScale * 0.5)}</span>
                  <span>{Math.round(peakScale * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* Bars container */}
                <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b border-border/60">
                  {monthlyData.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-muted-foreground mb-1">
                        {item.count}
                      </div>
                      <div
                        style={{ height: item.height }}
                        className="w-full max-w-[26px] rounded-t-sm bg-foreground/90 hover:bg-foreground transition-all cursor-pointer"
                      ></div>
                      <span className="text-[10px] text-muted-foreground font-medium mt-2">
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart footer indicator */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2">
                <span>Skala agenda bulanan</span>
                <span>Rata-rata: {averageMonthly} agenda / bulan</span>
                <span>
                  {maxMonthCount > 0
                    ? `Puncak: ${maxMonthCount} agenda (${peakMonthName})`
                    : 'Belum ada agenda tercatat'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Recent Reservations List (3/7 columns - matching Recent Sales) */}
          <Card className="lg:col-span-3">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Reservasi Terbaru</CardTitle>
                  <CardDescription className="text-xs">
                    Terdapat {totalReservations} agenda tercatat dalam sistem.
                  </CardDescription>
                </div>
                <Link href="/reservasi/riwayat">
                  <Button variant="ghost" size="iconSm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-1 space-y-4">
              {recentReservations.map((item) => {
                const initials = item.userName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('');

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar initials */}
                      <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center font-semibold text-xs text-foreground shrink-0 uppercase">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                          {item.eventName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.userName} • {item.roomName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-foreground block font-mono">
                        {item.startTime}
                      </span>
                      <Badge
                        variant={
                          item.status === 'disetujui'
                            ? 'success'
                            : item.status === 'menunggu'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[9px] px-1.5 py-0 mt-0.5"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: JADWAL HARI INI */}
      {activeTab === 'today' && (
        <Card>
          <CardHeader className="p-5 border-b border-border/60">
            <CardTitle className="text-base font-semibold">Rundown Agenda Hari Ini</CardTitle>
            <CardDescription className="text-xs">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5">
            {todaySchedules.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                Tidak ada agenda rapat terjadwal untuk hari ini.
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-3.5 rounded-lg border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="px-2.5 py-1.5 rounded-md bg-muted text-foreground border border-border text-center shrink-0">
                        <span className="block text-xs font-semibold font-mono">{schedule.startTime}</span>
                        <span className="block text-[10px] text-muted-foreground font-mono">{schedule.endTime}</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {schedule.eventName}
                          </p>
                          {schedule.categoryName && (
                            <Badge variant="neutral" className="text-[10px]">
                              {schedule.categoryName}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {schedule.roomName}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {schedule.executorOfficial || 'Pejabat Walikota'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="success" className="shrink-0 self-start sm:self-center">
                      Disetujui
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: STATISTIK RUANGAN */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const roomBookings = reservations.filter((r) => r.roomId === room.id && r.status === 'disetujui');
            return (
              <Card key={room.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={room.isActive ? 'success' : 'destructive'} className="text-[10px]">
                    {room.isActive ? 'Aktif' : 'Maintenance'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {room.capacity} org
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{room.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{room.buildingFloor}</p>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Terpakai:</span>
                  <span className="font-semibold text-foreground font-mono">{roomBookings.length} Kali</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 4: NOTIFIKASI SISTEM */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader className="p-5 border-b border-border/60">
            <CardTitle className="text-base font-semibold">Riwayat Notifikasi</CardTitle>
            <CardDescription className="text-xs">Pemberitahuan perubahan status pengajuan dan disposisi.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{notif.title}</span>
                  <span className="text-[10px] text-muted-foreground">Baru</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
