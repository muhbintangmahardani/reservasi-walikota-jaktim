'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Shirt,
  Building,
  Tag,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Save,
  MessageSquare,
} from 'lucide-react';
import { Reservation } from '../../../domain/entities/Reservation';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface EditSchedulePageViewProps {
  id: string;
}

export const EditSchedulePageView: React.FC<EditSchedulePageViewProps> = ({ id }) => {
  const router = useRouter();
  const { reservations, rooms, activeRooms, categories, updateReservation, checkConflict, isLoading } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isPimpinan = currentUser?.role === 'verifikator_pimpinan';
  const isAsisten = currentUser?.role === 'verifikator_asisten';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isPimpinan || isAsisten || isAdmin;

  // Find target reservation
  const reservation = reservations.find((r) => r.id === id);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [executorOfficial, setExecutorOfficial] = useState('');
  const [accompanyingOfficial, setAccompanyingOfficial] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [letterOrigin, setLetterOrigin] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [changeNote, setChangeNote] = useState('');

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref flag to ensure initialization runs strictly ONCE when reservation loads
  // This prevents user input from being reset or wiped out while typing!
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (reservation && !isInitializedRef.current) {
      setEventName(reservation.eventName || '');
      setEventDate(reservation.eventDate || '');
      setStartTime(reservation.startTime || '08:00');
      setEndTime(reservation.endTime || '11:00');
      setRoomId(reservation.roomId || (activeRooms[0]?.id ?? ''));
      setExecutorOfficial(reservation.executorOfficial || '');
      setAccompanyingOfficial(reservation.accompanyingOfficial || '');
      setDressCode(reservation.dressCode || 'Batik / Bebas Rapi');
      setLetterOrigin(reservation.letterOrigin || '');
      setCategoryId(reservation.categoryId || categories[0]?.id || '');
      isInitializedRef.current = true;
    }
  }, [reservation, activeRooms, categories]);

  // Realtime Conflict Check (only triggers when user modifies room or time)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!roomId || !eventDate || !startTime || !endTime || !reservation) return;
    if (startTime >= endTime) return;

    const timer = setTimeout(async () => {
      try {
        const conflict = await checkConflict(roomId, eventDate, startTime, endTime, reservation.id);
        if (conflict.hasConflict && conflict.conflictingReservation) {
          setConflictWarning(
            `Jadwal bentrok dengan: "${conflict.conflictingReservation.eventName}" (${conflict.conflictingReservation.startTime} - ${conflict.conflictingReservation.endTime} WIB)`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.warn('Conflict check error:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [roomId, eventDate, startTime, endTime, reservation?.id, checkConflict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    if (!eventName.trim()) {
      toast({
        title: 'Nama Acara Diperlukan',
        description: 'Silakan isi nama acara/kegiatan sebelum menyimpan.',
        variant: 'destructive',
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: 'Format Waktu Tidak Valid',
        description: 'Jam mulai harus lebih awal daripada jam selesai.',
        variant: 'destructive',
      });
      return;
    }

    const selectedRoom = rooms.find((r) => r.id === roomId);
    const selectedCat = categories.find((c) => c.id === categoryId);

    const roleName = isPimpinan
      ? 'Pimpinan (Walikota/Sekko)'
      : isAsisten
      ? 'Asisten Pemkot'
      : 'Administrator';

    const notifyMsg = changeNote.trim()
      ? `Penyesuaian Jadwal oleh ${currentUser?.fullName || roleName}: ${changeNote.trim()} (${eventDate}, ${startTime} - ${endTime} WIB di ${selectedRoom?.name || reservation.roomName}).`
      : `Jadwal agenda "${eventName}" telah disesuaikan oleh ${currentUser?.fullName || roleName} menjadi tanggal ${eventDate} pukul ${startTime} - ${endTime} WIB di ${selectedRoom?.name || reservation.roomName}.`;

    setIsSubmitting(true);
    try {
      await updateReservation(
        reservation.id,
        {
          eventName: eventName.trim(),
          eventDate,
          startTime,
          endTime,
          roomId,
          roomName: selectedRoom ? selectedRoom.name : reservation.roomName,
          executorOfficial: executorOfficial.trim() || 'Pimpinan Rapat',
          accompanyingOfficial: accompanyingOfficial.trim() || '-',
          dressCode: dressCode.trim() || 'Batik / Bebas Rapi',
          letterOrigin: letterOrigin.trim() || reservation.letterOrigin,
          categoryId: selectedCat?.id,
          categoryName: selectedCat?.name,
        },
        notifyMsg
      );

      toast({
        title: 'Jadwal Berhasil Diperbarui',
        description: `Perubahan jadwal "${eventName}" telah disimpan dan disiarkan secara realtime ke pemohon.`,
        variant: 'success',
      });

      router.push('/jadwal-pimpinan');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan perubahan jadwal.';
      toast({
        title: 'Gagal Memperbarui Jadwal',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: Unauthorized
  if (!canEdit) {
    return (
      <div className="w-full py-8">
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Halaman kelola jadwal hanya dapat diakses oleh role Pimpinan, Asisten, atau Administrator.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push('/kelola-jadwal')}>
              Kembali ke Kelola Jadwal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading && !reservation) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-6 w-64" />
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (!reservation && !isLoading) {
    return (
      <div className="w-full py-8">
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Agenda Tidak Ditemukan</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Data reservasi atau agenda rapat dengan ID tersebut tidak ditemukan dalam sistem.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push('/kelola-jadwal')}>
              Kembali ke Kelola Jadwal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top back button */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:text-foreground h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Kembali
        </Button>
      </div>

      {/* MAIN CARD */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4 border-b border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Kelola & Edit Jadwal Kegiatan</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Perbarui rincian waktu, ruangan rapat, kategori, dan penugasan pimpinan resmi.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px] bg-background">
                {reservation?.status === 'disetujui' ? 'Agenda Disetujui' : 'Menunggu Verifikasi'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Otoritas Akses Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-foreground">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-foreground">
                    Otoritas Akses: {isPimpinan ? 'Pimpinan Walikota / Sekko' : isAsisten ? 'Asisten Pemkot' : 'Administrator'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Pengubah: <span className="font-medium text-foreground">{currentUser?.fullName}</span> • Notifikasi penyesuaian akan langsung diteruskan ke pemohon.
                  </p>
                </div>
              </div>
            </div>

            {/* Realtime Conflict Warning Banner */}
            {conflictWarning && (
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs font-medium leading-relaxed">{conflictWarning}</div>
              </div>
            )}

            {/* SECTION 1: INFORMASI ACARA & JADWAL */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                Informasi Utama Kegiatan
              </h3>

              {/* Nama Acara */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Nama Agenda / Acara Rapat *
                </label>
                <Input
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Penataan Wilayah"
                  className="text-xs h-9"
                />
              </div>

              {/* Tanggal & Waktu (3 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Tanggal Pelaksanaan *
                  </label>
                  <Input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Jam Mulai *
                  </label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Jam Selesai *
                  </label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Ruangan Rapat & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Ruangan Rapat *
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {activeRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Kapasitas: {r.capacity} orang)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    Label Kategori Kegiatan
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: PROTOKOLER & PEJABAT */}
            <div className="space-y-3.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                Penugasan Pejabat & Protokoler
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Pejabat Pelaksana (Pimpinan Rapat) *
                  </label>
                  <Input
                    required
                    value={executorOfficial}
                    onChange={(e) => setExecutorOfficial(e.target.value)}
                    placeholder="Contoh: Walikota Jakarta Timur"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    Pejabat Pendamping
                  </label>
                  <Input
                    value={accompanyingOfficial}
                    onChange={(e) => setAccompanyingOfficial(e.target.value)}
                    placeholder="Contoh: Asisten Pemerintahan, Kabag Tapem"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-muted-foreground" />
                    Pakaian (Dress Code)
                  </label>
                  <Input
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder="Contoh: PDH / Batik / Bebas Rapi"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" />
                    Asal Surat / OPD Pemohon
                  </label>
                  <Input
                    value={letterOrigin}
                    onChange={(e) => setLetterOrigin(e.target.value)}
                    placeholder="Contoh: Bagian Tata Pemerintahan"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CATATAN ALASAN PENYESUAIAN */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                Catatan Penyesuaian untuk Pemohon
              </h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  Catatan / Instruksi Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Tuliskan catatan atau alasan penyesuaian jadwal untuk pemohon (misal: 'Waktu dimajukan 30 menit karena agenda Walikota')..."
                  className="flex w-full rounded-md border border-input bg-background p-3 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 border-t border-border/70 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Simpan Perubahan Jadwal
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

