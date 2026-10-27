'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  MessageCircle,
  ExternalLink,
  X,
  FileText,
  User,
  Shirt,
  Sparkles,
  Filter,
  Check,
  ChevronDown,
  Edit,
} from 'lucide-react';
import { Reservation } from '../../../domain/entities/Reservation';
import { EditScheduleDialog } from '../schedule/EditScheduleDialog';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '../../context/ToastContext';
import { cn } from '@/lib/utils';

// Color map for room categories to match Google Calendar aesthetic (Excludes yellow/amber so approved rooms never clash with pending warning color)
const ROOM_COLORS = [
  { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-500/15', chip: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-800' },
  { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', lightBg: 'bg-emerald-500/15', chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800' },
  { bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', lightBg: 'bg-violet-500/15', chip: 'bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-200 border-violet-300 dark:border-violet-800' },
  { bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-600', lightBg: 'bg-sky-500/15', chip: 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200 border-sky-300 dark:border-sky-800' },
  { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', lightBg: 'bg-indigo-500/15', chip: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800' },
  { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', lightBg: 'bg-teal-500/15', chip: 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200 border-teal-300 dark:border-teal-800' },
  { bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-600', lightBg: 'bg-cyan-500/15', chip: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800' },
  { bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-600', lightBg: 'bg-slate-500/15', chip: 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
];

const TIME_START_HOUR = 7; // 07:00 WIB
const TIME_END_HOUR = 20; // 20:00 WIB
const HOUR_SLOTS = Array.from({ length: TIME_END_HOUR - TIME_START_HOUR + 1 }, (_, i) => i + TIME_START_HOUR);

export const ScheduleCalendar: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isPimpinan = currentUser?.role === 'verifikator_pimpinan';
  const isAsisten = currentUser?.role === 'verifikator_asisten';
  const isAdmin = currentUser?.role === 'admin';
  const canManageSchedule = isPimpinan || isAsisten || isAdmin;

  const {
    reservations,
    rooms,
    activeRooms,
    picContacts,
    isLoading,
    createReservation,
    checkConflict,
  } = useReservations();

  // Navigation & View States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Room filters (toggled checkboxes)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Initialize room filters once rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && selectedRoomIds.length === 0) {
      setSelectedRoomIds(rooms.map((r) => r.id));
    }
  }, [rooms, selectedRoomIds.length]);

  // Selected reservation for Detail Modal
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Drag-to-create or Click-to-create states
  const [isDragging, setIsDragging] = useState(false);
  const [dragDayStr, setDragDayStr] = useState<string | null>(null);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragEndHour, setDragEndHour] = useState<number | null>(null);

  // Quick Create Modal state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '11:00',
    roomId: '',
    department: '',
    executorOfficial: '',
    dressCode: 'Batik / Bebas Rapi',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Set default room & department when quick create opens
  useEffect(() => {
    if (isQuickCreateOpen && !quickForm.roomId && activeRooms.length > 0) {
      setQuickForm((prev) => ({
        ...prev,
        roomId: activeRooms[0].id,
        department: currentUser?.unitName || 'Bagian Tata Pemerintahan',
      }));
    }
  }, [isQuickCreateOpen, quickForm.roomId, activeRooms, currentUser?.unitName]);

  // Real-time conflict checking inside quick create
  useEffect(() => {
    if (!isQuickCreateOpen || !quickForm.roomId || !quickForm.date || !quickForm.startTime || !quickForm.endTime) {
      setConflictWarning(null);
      return;
    }

    let isMounted = true;
    checkConflict(quickForm.roomId, quickForm.date, quickForm.startTime, quickForm.endTime).then((res) => {
      if (!isMounted) return;
      if (res.hasConflict && res.conflictingReservation) {
        setConflictWarning(
          `Jadwal Bentrok: Ruangan telah terisi oleh "${res.conflictingReservation.eventName}" (${res.conflictingReservation.startTime} - ${res.conflictingReservation.endTime} WIB).`
        );
      } else {
        setConflictWarning(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isQuickCreateOpen, quickForm.roomId, quickForm.date, quickForm.startTime, quickForm.endTime, checkConflict]);

  // Color mapping per room
  const roomColorMap = useMemo(() => {
    const map = new Map<string, typeof ROOM_COLORS[0]>();
    rooms.forEach((room, idx) => {
      map.set(room.id, ROOM_COLORS[idx % ROOM_COLORS.length]);
    });
    return map;
  }, [rooms]);

  // Filtered reservations based on selected rooms
  const visibleReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.roomId && selectedRoomIds.length > 0 && !selectedRoomIds.includes(r.roomId)) {
        return false;
      }
      return true;
    });
  }, [reservations, selectedRoomIds]);

  // Mini-calendar calculations (left sidebar)
  const miniCalendarDays = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(startM);
    const startW = startOfWeek(startM, { weekStartsOn: 1 });
    const endW = endOfWeek(endM, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = startW;
    while (d <= endW) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentDate]);

  // Week View days (Mon - Sun)
  const weekDays = useMemo(() => {
    const startW = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(startW, i));
  }, [currentDate]);

  // Month View days
  const monthDays = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(startM);
    const startW = startOfWeek(startM, { weekStartsOn: 1 });
    const endW = endOfWeek(endM, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = startW;
    while (d <= endW) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleSelectMiniDate = (day: Date) => {
    setCurrentDate(day);
    setSelectedDate(day);
  };

  // Toggle room filter
  const toggleRoomFilter = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAllRooms = () => {
    setSelectedRoomIds(rooms.map((r) => r.id));
  };

  const clearAllRooms = () => {
    setSelectedRoomIds([]);
  };

  // Drag Selection handlers
  const handleSlotMouseDown = (dayStr: string, hour: number) => {
    setIsDragging(true);
    setDragDayStr(dayStr);
    setDragStartHour(hour);
    setDragEndHour(hour + 1);
  };

  const handleSlotMouseEnter = (dayStr: string, hour: number) => {
    if (!isDragging || dragDayStr !== dayStr || dragStartHour === null) return;
    if (hour >= dragStartHour) {
      setDragEndHour(hour + 1);
    } else {
      setDragEndHour(dragStartHour + 1);
    }
  };

  const handleSlotMouseUp = () => {
    if (!isDragging || !dragDayStr || dragStartHour === null) return;

    const startH = Math.min(dragStartHour, dragEndHour ? dragEndHour - 1 : dragStartHour);
    const endH = Math.max(dragStartHour + 1, dragEndHour || dragStartHour + 1);

    const formattedStart = `${String(startH).padStart(2, '0')}:00`;
    const formattedEnd = `${String(Math.min(endH, 21)).padStart(2, '0')}:00`;

    setQuickForm((prev) => ({
      ...prev,
      date: dragDayStr,
      startTime: formattedStart,
      endTime: formattedEnd,
      roomId: prev.roomId || (activeRooms[0]?.id ?? ''),
      department:
        currentUser?.unitName ||
        (currentUser?.role === 'verifikator_pimpinan'
          ? 'Sekretariat Pimpinan (Walikota)'
          : 'Bagian Tata Pemerintahan'),
      executorOfficial:
        prev.executorOfficial ||
        (currentUser?.role === 'verifikator_pimpinan'
          ? currentUser.fullName || 'Walikota'
          : currentUser?.role === 'verifikator_asisten'
          ? currentUser.fullName || 'Asisten Pemerintahan'
          : ''),
    }));

    setIsDragging(false);
    setDragDayStr(null);
    setDragStartHour(null);
    setDragEndHour(null);
    setIsQuickCreateOpen(true);
  };

  // Cancel dragging if mouse leaves the calendar area
  const handleGridMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragDayStr(null);
      setDragStartHour(null);
      setDragEndHour(null);
    }
  };

  // Submit Quick Reservation
  const handleSaveQuickReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.title.trim()) {
      toast({
        title: 'Judul Acara Diperlukan',
        description: 'Silakan isi nama acara rapat sebelum menyimpan.',
        variant: 'destructive',
      });
      return;
    }

    if (!quickForm.roomId) {
      toast({
        title: 'Pilih Ruangan',
        description: 'Silakan pilih ruangan rapat yang ingin digunakan.',
        variant: 'destructive',
      });
      return;
    }

    const selectedRoom = rooms.find((r) => r.id === quickForm.roomId);

    setIsSubmitting(true);
    try {
      await createReservation({
        userId: currentUser?.id || '30000000-0000-0000-0000-000000000001',
        userName: currentUser?.fullName || 'Budi Setiawan',
        userEmail: currentUser?.email || 'budi@jakarta.go.id',
        roomId: quickForm.roomId,
        roomName: selectedRoom ? selectedRoom.name : 'Ruangan Rapat',
        eventName: quickForm.title.trim(),
        eventDate: quickForm.date,
        startTime: quickForm.startTime,
        endTime: quickForm.endTime,
        executorOfficial:
          quickForm.executorOfficial?.trim() ||
          (currentUser?.role === 'verifikator_pimpinan'
            ? currentUser.fullName || 'Walikota Jakarta Timur'
            : currentUser?.role === 'verifikator_asisten'
            ? currentUser.fullName || 'Asisten Pemerintahan'
            : 'Pimpinan Rapat'),
        accompanyingOfficial: '-',
        dressCode: quickForm.dressCode,
        letterOrigin:
          quickForm.department?.trim() ||
          currentUser?.unitName ||
          (currentUser?.role === 'verifikator_pimpinan'
            ? 'Sekretariat Pimpinan (Walikota)'
            : 'Bagian Pemerintahan'),
      });

      toast({
        title: 'Reservasi Berhasil Dibuat',
        description: `Pengajuan "${quickForm.title}" berhasil disimpan dan menunggu verifikasi Sekpim.`,
        variant: 'success',
      });

      setIsQuickCreateOpen(false);
      setQuickForm({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '11:00',
        roomId: activeRooms[0]?.id || '',
        department: currentUser?.unitName || 'Bagian Tata Pemerintahan',
        executorOfficial: '',
        dressCode: 'Batik / Bebas Rapi',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan reservasi.';
      toast({
        title: 'Gagal Menyimpan Reservasi',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Full Form with prefilled query
  const handleOpenFullForm = () => {
    const params = new URLSearchParams();
    if (quickForm.date) params.set('date', quickForm.date);
    if (quickForm.startTime) params.set('startTime', quickForm.startTime);
    if (quickForm.endTime) params.set('endTime', quickForm.endTime);
    if (quickForm.roomId) params.set('roomId', quickForm.roomId);
    if (quickForm.title) params.set('title', quickForm.title);
    router.push(`/reservasi/baru?${params.toString()}`);
  };

  // Helper to calculate pixel position for reservations inside time slot column
  const getReservationStyle = (res: Reservation) => {
    const [startH, startM] = res.startTime.split(':').map(Number);
    const [endH, endM] = res.endTime.split(':').map(Number);

    const startDecimal = startH + (startM || 0) / 60;
    const endDecimal = endH + (endM || 0) / 60;

    const topOffset = Math.max(0, (startDecimal - TIME_START_HOUR) * 60);
    const durationHours = Math.max(0.5, endDecimal - startDecimal);
    const height = durationHours * 60;

    return {
      top: `${topOffset}px`,
      height: `${Math.max(28, height - 2)}px`,
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-[640px] bg-background text-foreground select-none">
      {/* GOOGLE CALENDAR TOP BAR */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
        {/* Left: Brand / Sidebar toggle / Today / Nav */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground hidden lg:flex"
            title="Sembunyikan / Tampilkan Sidebar"
          >
            <Filter className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-3 text-xs font-semibold rounded-md shadow-2xs hover:bg-muted"
            >
              Hari Ini
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handlePrev}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleNext}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground capitalize">
            {viewMode === 'day'
              ? format(currentDate, 'EEEE, d MMMM yyyy', { locale: localeId })
              : format(currentDate, 'MMMM yyyy', { locale: localeId })}
          </h2>
        </div>

        {/* Right: View Mode Toggle & Quick Add Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                viewMode === 'day'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Bulanan
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setQuickForm((prev) => ({
                ...prev,
                date: format(currentDate, 'yyyy-MM-dd'),
                startTime: '09:00',
                endTime: '11:00',
                roomId: activeRooms[0]?.id || '',
              }));
              setIsQuickCreateOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buat Reservasi</span>
          </Button>
        </div>
      </header>

      {/* MAIN CONTAINER: LEFT SIDEBAR + CALENDAR GRID */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT SIDEBAR (GOOGLE CALENDAR STYLE) */}
        {isSidebarOpen && (
          <aside className="w-64 shrink-0 border-r border-border bg-card/60 p-4 flex flex-col gap-5 overflow-y-auto hidden lg:flex">
            {/* Quick Create Button Pill */}
            <Button
              onClick={() => {
                setQuickForm((prev) => ({
                  ...prev,
                  date: format(selectedDate, 'yyyy-MM-dd'),
                  startTime: '09:00',
                  endTime: '11:00',
                  roomId: activeRooms[0]?.id || '',
                }));
                setIsQuickCreateOpen(true);
              }}
              className="w-full gap-2 h-10 rounded-full shadow-md text-xs font-semibold justify-start px-4 hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Reservasi Ruang</span>
            </Button>

            {/* Mini Month Calendar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
                <span className="capitalize">{format(currentDate, 'MMMM yyyy', { locale: localeId })}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    aria-label="Bulan lalu"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    aria-label="Bulan berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground py-1">
                <span>S</span>
                <span>S</span>
                <span>R</span>
                <span>K</span>
                <span>J</span>
                <span>S</span>
                <span>M</span>
              </div>

              {/* Mini calendar day cells */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {miniCalendarDays.map((day, idx) => {
                  const isCurMonth = isSameMonth(day, currentDate);
                  const isSel = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectMiniDate(day)}
                      className={cn(
                        'w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] transition-colors',
                        !isCurMonth && 'text-muted-foreground/40',
                        isCurMonth && !isSel && !isCurrentDay && 'text-foreground hover:bg-muted',
                        isCurrentDay && !isSel && 'border border-primary text-primary font-bold',
                        isSel && 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Room Filters (My Calendars style) */}
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground tracking-tight">Daftar Ruangan</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={selectAllRooms}
                    className="text-primary hover:underline font-medium"
                  >
                    Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    onClick={clearAllRooms}
                    className="text-muted-foreground hover:underline"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const color = roomColorMap.get(room.id) || ROOM_COLORS[0];
                  const isChecked = selectedRoomIds.includes(room.id);
                  return (
                    <label
                      key={room.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRoomFilter(room.id)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded flex items-center justify-center border transition-all',
                          isChecked
                            ? `${color.bg} border-transparent text-white`
                            : 'border-muted-foreground/50 bg-background'
                        )}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className={cn('truncate flex-1', isChecked ? 'text-foreground' : 'text-muted-foreground')}>
                        {room.name}
                      </span>
                      {!room.isActive && (
                        <span className="text-[9px] px-1 bg-amber-500/10 text-amber-600 rounded">
                          Maint.
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status Legend */}
            <div className="pt-3 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
              <div className="font-semibold text-foreground text-xs mb-1">Status Agenda</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Disetujui (Resmi)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Menunggu Sekpim</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span>Agenda Pimpinan</span>
              </div>
            </div>
          </aside>
        )}

        {/* CALENDAR VIEWPORT */}
        <main
          className="flex-1 overflow-auto bg-card/30 flex flex-col relative"
          onMouseLeave={handleGridMouseLeave}
          onMouseUp={handleSlotMouseUp}
        >
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-[480px] w-full rounded-lg" />
            </div>
          ) : viewMode === 'month' ? (
            /* MONTH VIEW */
            <div className="flex-1 flex flex-col p-3">
              {/* Day header */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/40 py-2 text-center text-xs font-semibold text-muted-foreground">
                <span>SENIN</span>
                <span>SELASA</span>
                <span>RABU</span>
                <span>KAMIS</span>
                <span>JUMAT</span>
                <span>SABTU</span>
                <span>MINGGU</span>
              </div>

              {/* 35/42 days grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border border-b border-l border-r border-border bg-card">
                {monthDays.map((day, idx) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const dayEvents = visibleReservations.filter((r) => r.eventDate === dayStr);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode('day');
                      }}
                      className={cn(
                        'min-h-[95px] p-1.5 flex flex-col gap-1 transition-colors hover:bg-muted/30 cursor-pointer overflow-hidden',
                        !isCurMonth && 'bg-muted/15 text-muted-foreground/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center',
                            isCurrentDay
                              ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                              : 'text-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {dayEvents.length} agenda
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                        {dayEvents.slice(0, 3).map((res) => {
                          const roomColor = (res.roomId && roomColorMap.get(res.roomId)) || ROOM_COLORS[0];
                          const isApproved = res.status === 'disetujui';
                          const isPending = res.status === 'menunggu';

                          return (
                            <div
                              key={res.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservation(res);
                              }}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center justify-between gap-1 border transition-transform hover:scale-[1.02]',
                                isPending
                                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-800 border-dashed'
                                  : `${roomColor.chip} border-l-2 ${roomColor.border}`
                              )}
                              title={`${res.eventName} (${res.startTime} - ${res.endTime}) - ${isApproved ? 'Disetujui' : 'Menunggu'}`}
                            >
                              <div className="flex items-center gap-1 min-w-0 truncate">
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                                  )}
                                />
                                <span className="truncate">{res.eventName}</span>
                              </div>
                              {isApproved && (
                                <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[3]" />
                              )}
                              {isPending && (
                                <span className="text-[8px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                                  ⏳
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                            +{dayEvents.length - 3} lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TIME GRID VIEW (WEEK OR DAY) */
            <div className="flex-1 flex flex-col min-w-[700px] overflow-x-auto">
              {/* TOP HEADER: GMT/WIB + DAYS COLUMN HEADERS */}
              <div className="flex border-b border-border bg-card sticky top-0 z-20 shadow-2xs">
                {/* Time header placeholder */}
                <div className="w-16 shrink-0 p-2 text-center text-[10px] font-semibold text-muted-foreground border-r border-border flex flex-col justify-end">
                  <span>WIB</span>
                </div>

                {/* Days column headers */}
                <div className="flex-1 grid grid-flow-col auto-cols-fr divide-x divide-border">
                  {(viewMode === 'week' ? weekDays : [selectedDate]).map((day, idx) => {
                    const isCurrentDay = isToday(day);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-2 text-center transition-colors',
                          isCurrentDay && 'bg-primary/5'
                        )}
                      >
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                          {format(day, 'EEE', { locale: localeId })}
                        </div>
                        <div
                          className={cn(
                            'text-base font-bold w-8 h-8 mx-auto rounded-full flex items-center justify-center mt-0.5',
                            isCurrentDay
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'text-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRID BODY: TIME SLOTS & RESERVATION BLOCKS */}
              <div className="flex flex-1 relative min-h-[840px]">
                {/* Time Axis Column */}
                <div className="w-16 shrink-0 divide-y divide-border border-r border-border bg-card/40 text-right pr-2.5 select-none">
                  {HOUR_SLOTS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] text-[11px] font-medium text-muted-foreground pt-1.5 flex items-start justify-end"
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                <div className="flex-1 grid grid-flow-col auto-cols-fr divide-x divide-border relative">
                  {(viewMode === 'week' ? weekDays : [selectedDate]).map((day, dayIndex) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayReservations = visibleReservations.filter((r) => r.eventDate === dayStr);

                    return (
                      <div
                        key={dayIndex}
                        className="relative h-[840px] divide-y divide-border/60 hover:bg-muted/10 transition-colors"
                      >
                        {/* Hour slot backdrops (Click / Drag triggers) */}
                        {HOUR_SLOTS.map((hour) => {
                          const isSlotHighlighted =
                            isDragging &&
                            dragDayStr === dayStr &&
                            dragStartHour !== null &&
                            dragEndHour !== null &&
                            hour >= Math.min(dragStartHour, dragEndHour - 1) &&
                            hour < Math.max(dragStartHour + 1, dragEndHour);

                          return (
                            <div
                              key={hour}
                              onMouseDown={() => handleSlotMouseDown(dayStr, hour)}
                              onMouseEnter={() => handleSlotMouseEnter(dayStr, hour)}
                              className={cn(
                                'h-[60px] cursor-pointer transition-colors relative border-dashed border-border/40',
                                isSlotHighlighted ? 'bg-primary/20' : 'hover:bg-primary/5'
                              )}
                            />
                          );
                        })}

                        {/* DRAG-TO-CREATE LIVE SELECTION BOX (Google Calendar style) */}
                        {isDragging &&
                          dragDayStr === dayStr &&
                          dragStartHour !== null &&
                          dragEndHour !== null && (
                            <div
                              style={{
                                top: `${(Math.min(dragStartHour, dragEndHour - 1) - TIME_START_HOUR) * 60}px`,
                                height: `${Math.max(1, Math.abs(dragEndHour - dragStartHour)) * 60 - 2}px`,
                              }}
                              className="absolute left-1 right-1 bg-primary/85 text-primary-foreground rounded-lg p-2 shadow-lg z-30 pointer-events-none flex flex-col justify-between border border-primary animate-in fade-in zoom-in-95 duration-100"
                            >
                              <div className="font-semibold text-xs truncate">(Reservasi Baru)</div>
                              <div className="text-[10px] opacity-90 font-medium">
                                {String(Math.min(dragStartHour, dragEndHour - 1)).padStart(2, '0')}:00 -{' '}
                                {String(Math.max(dragStartHour + 1, dragEndHour)).padStart(2, '0')}:00 WIB
                              </div>
                            </div>
                          )}

                        {/* RENDER RESERVATION BLOCKS ON THE TIME GRID */}
                        {dayReservations.map((res) => {
                          const style = getReservationStyle(res);
                          const roomColor = (res.roomId && roomColorMap.get(res.roomId)) || ROOM_COLORS[0];
                          const isApproved = res.status === 'disetujui';
                          const isPending = res.status === 'menunggu';

                          return (
                            <div
                              key={res.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservation(res);
                              }}
                              style={style}
                              className={cn(
                                'absolute left-1 right-1 rounded-md p-1.5 shadow-xs border cursor-pointer transition-all hover:shadow-md hover:z-20 overflow-hidden flex flex-col justify-between group',
                                isApproved
                                  ? `${roomColor.chip} border-l-4 ${roomColor.border}`
                                  : isPending
                                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-l-4 border-l-amber-500 border-dashed border-amber-300 dark:border-amber-800'
                                  : 'bg-red-50 dark:bg-red-950/70 text-red-950 dark:text-red-200 border-l-4 border-l-red-500 border-red-300 dark:border-red-800'
                              )}
                              title={`${res.eventName} | ${res.startTime} - ${res.endTime} | ${res.roomName} (${isApproved ? 'Disetujui' : isPending ? 'Menunggu Sekpim' : 'Ditolak'})`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-xs truncate leading-tight">
                                  {res.eventName}
                                </span>
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Acc
                                  </span>
                                ) : isPending ? (
                                  <Badge variant="warning" className="text-[9px] px-1 py-0 h-4 shrink-0 font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300">
                                    Menunggu
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="text-[10px] opacity-90 truncate flex items-center gap-1 font-medium mt-0.5">
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span>{res.startTime} - {res.endTime}</span>
                              </div>

                              <div className="text-[10px] opacity-80 truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{res.roomName}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* GOOGLE CALENDAR QUICK RESERVATION MODAL */}
      <Dialog
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        title="Buat Reservasi Ruangan Cepat"
        description="Pilih ruangan, atur jam pelaksanaan dan ajukan ke Meja Verifikasi Sekpim."
      >
        <form onSubmit={handleSaveQuickReservation} className="space-y-4 text-xs">
          {/* Realtime Conflict Warning Banner */}
          {conflictWarning && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="text-xs font-medium">{conflictWarning}</div>
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Nama Agenda / Kegiatan *</label>
            <Input
              placeholder="Contoh: Rapat Koordinasi Penataan Wilayah Bersama Camat..."
              value={quickForm.title}
              onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
              className="text-xs h-9"
              autoFocus
              required
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Tanggal</label>
              <Input
                type="date"
                value={quickForm.date}
                onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                className="text-xs h-8"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Jam Mulai</label>
              <Input
                type="time"
                value={quickForm.startTime}
                onChange={(e) => setQuickForm({ ...quickForm, startTime: e.target.value })}
                className="text-xs h-8"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Jam Selesai</label>
              <Input
                type="time"
                value={quickForm.endTime}
                onChange={(e) => setQuickForm({ ...quickForm, endTime: e.target.value })}
                className="text-xs h-8"
                required
              />
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Pilih Ruangan Rapat *</label>
            <select
              value={quickForm.roomId}
              onChange={(e) => setQuickForm({ ...quickForm, roomId: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              required
            >
              <option value="" disabled>
                -- Pilih Ruang Rapat Tersedia --
              </option>
              {activeRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.buildingFloor} - Kapasitas {room.capacity} org)
                </option>
              ))}
            </select>
          </div>

          {/* Department / Asal Surat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Asal Bagian / OPD</label>
              <Input
                placeholder="Contoh: Bagian Tata Pemerintahan"
                value={quickForm.department}
                onChange={(e) => setQuickForm({ ...quickForm, department: e.target.value })}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Pimpinan Rapat / Pelaksana</label>
              <Input
                placeholder="Contoh: Walikota / Sekko / Kabag"
                value={quickForm.executorOfficial}
                onChange={(e) => setQuickForm({ ...quickForm, executorOfficial: e.target.value })}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenFullForm}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <span>Formulir Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuickCreateOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !!conflictWarning}
                className="text-xs gap-1.5"
              >
                {isSubmitting && <span className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />}
                <span>Simpan Pengajuan</span>
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* RESERVATION DETAIL MODAL */}
      <Dialog
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        title={selectedReservation?.eventName || 'Detail Kegiatan'}
        description={`Status: ${selectedReservation?.status?.toUpperCase()}`}
      >
        {selectedReservation && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div>
                <span className="text-muted-foreground block text-[10px]">Hari & Tanggal</span>
                <span className="font-medium text-foreground">
                  {format(parseISO(selectedReservation.eventDate), 'dd MMMM yyyy', { locale: localeId })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Waktu</span>
                <span className="font-medium text-foreground">
                  {selectedReservation.startTime} - {selectedReservation.endTime} WIB
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Tempat / Ruangan:</span>
                <span className="font-medium text-foreground">{selectedReservation.roomName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pejabat Pelaksana:</span>
                <span className="font-medium text-foreground">{selectedReservation.executorOfficial || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pejabat Pendamping:</span>
                <span className="font-medium text-foreground">{selectedReservation.accompanyingOfficial || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pakaian (Dress Code):</span>
                <span className="font-medium text-foreground">{selectedReservation.dressCode || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Asal Surat:</span>
                <span className="font-medium text-foreground">{selectedReservation.letterOrigin || '-'}</span>
              </div>
            </div>

            {selectedReservation.categoryName && (
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Label Kategori:</span>
                <span className="font-semibold text-foreground">{selectedReservation.categoryName}</span>
              </div>
            )}

            {/* Hubungi PIC WhatsApp */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Koordinasi Perubahan via WhatsApp PIC</span>
              </div>
              <div className="space-y-1.5">
                {picContacts.map((pic) => (
                  <a
                    key={pic.id}
                    href={`https://wa.me/${pic.whatsappNumber}?text=Halo%20${encodeURIComponent(pic.picName)},%20saya%20ingin%20koordinasi%20mengenai%20jadwal%20${encodeURIComponent(selectedReservation.eventName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 text-[11px] font-medium transition-colors"
                  >
                    <span>Bidang {pic.sectorName}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      Chat WA <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {canManageSchedule && (
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs h-8 px-3 font-medium"
                  onClick={() => {
                    const res = selectedReservation;
                    setSelectedReservation(null);
                    setEditingReservation(res);
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Jadwal
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedReservation(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* EDIT JADWAL DIALOG (KHUSUS PIMPINAN, ASISTEN & ADMIN) */}
      <EditScheduleDialog
        isOpen={!!editingReservation}
        onClose={() => setEditingReservation(null)}
        reservation={editingReservation}
      />
    </div>
  );
};
