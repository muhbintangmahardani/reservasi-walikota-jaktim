'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Users,
  Shirt,
  FileText,
  AlertCircle,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Reservation } from '../../../domain/entities/Reservation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const LETTER_ORIGINS = [
  'Bagian Pemerintahan',
  'Bagian Hukum',
  'Bagian Kepegawaian, Ketatalaksanaan, dan Pelayanan Publik (KKPP)',
  'Bagian Perekonomian',
  'Bagian Pembangunan dan Lingkungan Hidup (PLH)',
  'Bagian Umum dan Protokol',
  'Bagian Kesejahteraan Rakyat (Kesra)',
  'Bagian Program, Pelaporan, dan Keuangan (PPK)',
  'Pemberdayaan Kesejahteraan Keluarga (PKK)',
  'Suku Dinas / Unit Kerja Perangkat Daerah (UKPD)',
  'Instansi Eksternal Resmi',
];

export const ReservationForm: React.FC = () => {
  const router = useRouter();
  const { activeRooms, createReservation, checkConflict } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(activeRooms[0]?.id || '');
  const [customRoomName, setCustomRoomName] = useState('');
  const [executorOfficial, setExecutorOfficial] = useState('');
  const [accompanyingOfficial, setAccompanyingOfficial] = useState('');
  const [dressCode, setDressCode] = useState('Pakaian Dinas Harian (PDH)');
  const [letterOrigin, setLetterOrigin] = useState(currentUser?.unitName || LETTER_ORIGINS[0]);

  const [conflictState, setConflictState] = useState<{
    hasConflict: boolean;
    conflictingReservation?: Reservation;
  }>({ hasConflict: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (!selectedRoomId || selectedRoomId === 'lainnya') {
        setConflictState({ hasConflict: false });
        return;
      }
      if (startTime >= endTime) {
        setConflictState({ hasConflict: false });
        return;
      }

      const res = await checkConflict(selectedRoomId, eventDate, startTime, endTime);
      setConflictState(res);
    };

    validate();
  }, [selectedRoomId, eventDate, startTime, endTime, checkConflict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (startTime >= endTime) {
      const msg = 'Jam selesai harus lebih akhir dari jam mulai.';
      setErrorMessage(msg);
      toast({
        title: 'Rentang Waktu Tidak Valid',
        description: msg,
        variant: 'warning',
      });
      return;
    }

    if (conflictState.hasConflict) {
      const msg = 'Ruangan sudah terisi pada jam tersebut. Silakan pilih waktu atau ruangan lain.';
      setErrorMessage(msg);
      toast({
        title: 'Jadwal Bentrok!',
        description: `Ruangan telah di-booking untuk "${conflictState.conflictingReservation?.eventName}". Silakan pilih waktu atau ruangan lain.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isCustom = selectedRoomId === 'lainnya';
      const targetRoom = activeRooms.find((r) => r.id === selectedRoomId);
      const roomName = isCustom ? (customRoomName || 'Ruangan Khusus') : (targetRoom?.name || 'Ruangan');

      await createReservation({
        userId: currentUser?.id || '30000000-0000-0000-0000-000000000001',
        userName: currentUser?.fullName || 'Budi Setiawan',
        userEmail: currentUser?.email || 'budi@jakarta.go.id',
        roomId: isCustom ? undefined : targetRoom?.id,
        roomName,
        customRoomName: isCustom ? customRoomName : undefined,
        eventName,
        eventDate,
        startTime,
        endTime,
        executorOfficial:
          executorOfficial?.trim() ||
          (currentUser?.role === 'verifikator_pimpinan'
            ? currentUser.fullName || 'Walikota Jakarta Timur'
            : currentUser?.role === 'verifikator_asisten'
            ? currentUser.fullName || 'Asisten Pemerintahan'
            : 'Pimpinan Rapat'),
        accompanyingOfficial: accompanyingOfficial || '-',
        dressCode: dressCode || 'Batik / Bebas Rapi',
        letterOrigin:
          letterOrigin?.trim() ||
          currentUser?.unitName ||
          (currentUser?.role === 'verifikator_pimpinan'
            ? 'Sekretariat Pimpinan (Walikota)'
            : 'Bagian Pemerintahan'),
      });

      toast({
        title: 'Pengajuan Berhasil Disimpan',
        description: `Pengajuan ruangan "${roomName}" untuk acara "${eventName}" sedang menunggu verifikasi Sekpim.`,
        variant: 'success',
      });

      router.push('/reservasi/riwayat');
    } catch (err: any) {
      const msg = err.message || 'Gagal membuat reservasi ruangan';
      setErrorMessage(msg);
      toast({
        title: 'Gagal Menyimpan Reservasi',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoomObj = activeRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Formulir Reservasi Ruangan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pengajuan akan diverifikasi oleh Sekretariat Pimpinan (Sekpim).
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Kembali
        </Button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CONFLICT WARNING INLINE */}
      {conflictState.hasConflict && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Jadwal Bentrok Terdeteksi</span>
            <p className="text-[11px] leading-relaxed">
              Ruangan ini telah disetujui untuk: <b>{conflictState.conflictingReservation?.eventName}</b> (Pukul {conflictState.conflictingReservation?.startTime} - {conflictState.conflictingReservation?.endTime} WIB).
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Waktu & Tanggal */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                1. Jadwal Pelaksanaan
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tanggal Rapat *</label>
                  <Input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Jam Mulai *</label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Jam Selesai *</label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ruangan */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                2. Pemilihan Ruangan
              </span>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Tempat / Ruangan *</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <optgroup label="Ruangan Rapat Resmi">
                    {activeRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} (Kapasitas: {room.capacity} org)
                      </option>
                    ))}
                  </optgroup>
                  <option value="lainnya">Lainnya (Tempat Khusus / Luar Ruangan)</option>
                </select>

                {selectedRoomId === 'lainnya' && (
                  <Input
                    type="text"
                    required
                    placeholder="Tuliskan nama lokasi/ruangan khusus..."
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    className="mt-2"
                  />
                )}

                {selectedRoomObj && (
                  <p className="text-[11px] text-muted-foreground pt-1">
                    {selectedRoomObj.buildingFloor} • Kapasitas: {selectedRoomObj.capacity} orang • Fasilitas: {selectedRoomObj.facilities.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Agenda & Protokoler */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                3. Detail Acara & Protokoler
              </span>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nama Acara / Kegiatan *</label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Koordinasi Penataan Kota"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Pejabat Pelaksana *</label>
                    <Input
                      type="text"
                      required
                      placeholder="Walikota / Sekko / Asisten"
                      value={executorOfficial}
                      onChange={(e) => setExecutorOfficial(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Pejabat Pendamping</label>
                    <Input
                      type="text"
                      placeholder="Para Camat / Kasudin"
                      value={accompanyingOfficial}
                      onChange={(e) => setAccompanyingOfficial(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Pakaian (Dress Code) *</label>
                    <Input
                      type="text"
                      required
                      placeholder="PDH / Batik / PSL"
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Asal Surat / Undangan *</label>
                    <select
                      required
                      value={letterOrigin}
                      onChange={(e) => setLetterOrigin(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {LETTER_ORIGINS.map((origin) => (
                        <option key={origin} value={origin}>
                          {origin}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Pemohon: <span className="font-medium text-foreground">{currentUser?.fullName || 'Pengguna'}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Pengisian Dibatalkan',
                    description: 'Kembali ke halaman sebelumnya.',
                    variant: 'info',
                  });
                  router.back();
                }}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={conflictState.hasConflict || isSubmitting}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

