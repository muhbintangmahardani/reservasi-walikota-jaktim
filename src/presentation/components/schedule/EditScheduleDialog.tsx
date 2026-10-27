'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Reservation } from '../../../domain/entities/Reservation';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface EditScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export const EditScheduleDialog: React.FC<EditScheduleDialogProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const { rooms, activeRooms, categories, updateReservation, checkConflict } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isPimpinan = currentUser?.role === 'verifikator_pimpinan';
  const isAsisten = currentUser?.role === 'verifikator_asisten';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isPimpinan || isAsisten || isAdmin;

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

  // Sync form when reservation changes
  useEffect(() => {
    if (reservation) {
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
      setChangeNote('');
      setConflictWarning(null);
    }
  }, [reservation, activeRooms, categories]);

  // Realtime Conflict Check
  useEffect(() => {
    const checkScheduleConflict = async () => {
      if (!roomId || !eventDate || !startTime || !endTime || !reservation) return;
      if (startTime >= endTime) return;

      try {
        const conflict = await checkConflict(roomId, eventDate, startTime, endTime, reservation.id);
        if (conflict.hasConflict && conflict.conflictingReservation) {
          setConflictWarning(
            `Jadwal bentrok dengan: "${conflict.conflictingReservation.eventName}" (${conflict.conflictingReservation.startTime} - ${conflict.conflictingReservation.endTime})`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.warn('Conflict check error:', err);
      }
    };

    const timer = setTimeout(checkScheduleConflict, 300);
    return () => clearTimeout(timer);
  }, [roomId, eventDate, startTime, endTime, reservation, checkConflict]);

  if (!canEdit) {
    return null;
  }

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
      ? 'Asisten Pemerintahan'
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

      onClose();
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola & Edit Jadwal Kegiatan"
      description="Penyesuaian waktu, ruangan, dan penugasan pejabat resmi oleh Pimpinan / Asisten."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Role Authority Indicator */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/25 text-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-foreground">
                Otoritas Akses: {isPimpinan ? 'Pimpinan Walikota / Sekko' : isAsisten ? 'Asisten Pemkot' : 'Administrator'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Pengubah: <span className="font-medium text-foreground">{currentUser?.fullName}</span> • Notifikasi otomatis terkirim ke unit pengaju.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] bg-background">
            {reservation?.status === 'disetujui' ? 'Agenda Disetujui' : 'Menunggu Verifikasi'}
          </Badge>
        </div>

        {/* Realtime Conflict Warning Banner */}
        {conflictWarning && (
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="text-[11px] font-medium leading-relaxed">{conflictWarning}</div>
          </div>
        )}

        <div className="space-y-3">
          {/* 1. Nama Acara */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Nama Agenda / Acara Rapat *
            </label>
            <Input
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Penataan Wilayah"
              className="text-xs h-8"
            />
          </div>

          {/* 2. Tanggal & Waktu (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Pelaksanaan *
              </label>
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Jam Mulai *
              </label>
              <Input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Jam Selesai *
              </label>
              <Input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* 3. Ruangan & Kategori (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Pilihan Ruang Rapat *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {activeRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.buildingFloor})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Label Kategori Kegiatan
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Pejabat Pelaksana & Pendamping (Card Panel) */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Pejabat Pelaksana / Pimpinan *
                </label>
                <Input
                  required
                  value={executorOfficial}
                  onChange={(e) => setExecutorOfficial(e.target.value)}
                  placeholder="Contoh: Walikota / Sekko / Aspem"
                  className="text-xs h-8 bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  Pejabat Pendamping
                </label>
                <Input
                  value={accompanyingOfficial}
                  onChange={(e) => setAccompanyingOfficial(e.target.value)}
                  placeholder="Contoh: Ka. Sudin Kominfotik, Kabag Pem"
                  className="text-xs h-8 bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-muted-foreground" />
                  Pakaian (Dress Code)
                </label>
                <Input
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="Contoh: Batik Lengan Panjang / PDH"
                  className="text-xs h-8 bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  Asal Surat / Unit Pengaju
                </label>
                <Input
                  value={letterOrigin}
                  onChange={(e) => setLetterOrigin(e.target.value)}
                  placeholder="Contoh: Bagian Tata Pemerintahan"
                  className="text-xs h-8 bg-background"
                />
              </div>
            </div>
          </div>

          {/* 5. Catatan / Alasan Perubahan untuk Notifikasi */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Catatan / Alasan Penyesuaian Jadwal (Opsional)
            </label>
            <textarea
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Contoh: Rapat dimajukan 30 menit karena agenda mendesak Walikota ke Balai Kota."
              className="flex w-full rounded-md border border-input bg-background p-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Catatan ini akan otomatis disertakan dalam notifikasi resmi ke akun pemohon ({reservation?.userName || 'Unit Pengaju'}).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Simpan Perubahan Jadwal
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

