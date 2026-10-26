'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Power,
  Loader2,
} from 'lucide-react';
import { Room } from '../../../domain/entities/Room';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export const RoomManagement: React.FC = () => {
  const { rooms, toggleRoomStatus, isLoading } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingRoomId, setTogglingRoomId] = useState<string | null>(null);

  // Add Room Dialog Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newFloor, setNewFloor] = useState('Gedung Blok A, Lantai 3');
  const [newCapacity, setNewCapacity] = useState('30');
  const [newFacilities, setNewFacilities] = useState('Proyektor HD, AC Split, Sound System, Mic Wireless');
  const [newDescription, setNewDescription] = useState('');

  // Hak akses pengelolaan status ruangan: Khusus Aspem, Walikota, dan Admin
  const canManageRooms =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'verifikator_asisten' ||
    currentUser?.role === 'verifikator_pimpinan';
  const isAdmin = currentUser?.role === 'admin';

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === 'active' && !r.isActive) return false;
    if (filterStatus === 'inactive' && r.isActive) return false;
    if (
      searchQuery &&
      !r.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.buildingFloor.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleToggle = async (room: Room) => {
    if (!canManageRooms) {
      toast({
        title: 'Akses Ditolak',
        description: 'Hanya Aspem, Walikota, dan Admin yang memiliki hak mengaktifkan/menonaktifkan ruangan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTogglingRoomId(room.id);
      await toggleRoomStatus(room.id);
      const nextActive = !room.isActive;
      toast({
        title: nextActive ? 'Ruangan Diaktifkan Kembali' : 'Ruangan Dialihkan ke Pemeliharaan',
        description: nextActive
          ? `Ruangan "${room.name}" sekarang aktif dan siap menerima permohonan rapat.`
          : `Ruangan "${room.name}" sekarang dalam status renovasi/maintenance (tidak dapat dipesan).`,
        variant: nextActive ? 'success' : 'warning',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Memperbarui Status',
        description: err.message || 'Terjadi kesalahan sistem.',
        variant: 'destructive',
      });
    } finally {
      setTogglingRoomId(null);
    }
  };

  const handleSaveNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddModalOpen(false);
    toast({
      title: 'Ruangan Berhasil Ditambahkan',
      description: `Ruangan "${newRoomName}" telah didaftarkan ke katalog master ruangan.`,
      variant: 'success',
    });
    setNewRoomName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Data Ruang Rapat & Fasilitas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar ruangan resmi, kapasitas daya tampung, dan status operasional.
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Ruangan
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Cari ruangan atau lantai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Siap Pakai</option>
            <option value="inactive">Nonaktif (Maintenance / Renovasi)</option>
          </select>
        </div>
      </div>

      {/* Grid Cards (Minimalist Shadcn) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden space-y-3 p-4">
                <Skeleton className="h-36 w-full rounded-md" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-1.5 pt-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={cn(
                "overflow-hidden flex flex-col justify-between hover:border-border transition-colors",
                !room.isActive && "border-amber-500/30 bg-card/60"
              )}
            >
              {/* Image Header with subtle overlay */}
              <div className="relative h-36 bg-muted overflow-hidden border-b border-border/60">
                <img
                  src={room.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'}
                  alt={room.name}
                  className={cn(
                    "w-full h-full object-cover transition-all",
                    !room.isActive && "grayscale-40 contrast-90 opacity-80"
                  )}
                />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={room.isActive ? 'success' : 'destructive'}
                    className="text-[10px] gap-1 px-2 py-0.5 shadow-xs"
                  >
                    {room.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Siap Pakai</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Dalam Renovasi</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{room.buildingFloor}</span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {room.capacity} Orang
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-foreground">{room.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {room.description || 'Fasilitas rapat resmi Pemerintah Kota Administrasi Jakarta Timur.'}
                  </p>
                </div>

                {/* Maintenance Warning Banner if Inactive */}
                {!room.isActive && (
                  <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                    <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span className="text-[11px] leading-snug">
                      Sedang dalam pemeliharaan berkala atau renovasi interior ruangan.
                    </span>
                  </div>
                )}

                {/* Facilities tags */}
                <div className="pt-2 border-t border-border/60 space-y-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Fasilitas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {room.facilities.map((fac) => (
                      <span
                        key={fac}
                        className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/60"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Switcher: Khusus Aspem, Walikota, dan Admin */}
                {canManageRooms ? (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-foreground block">
                        Status Ruangan:
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {room.isActive ? 'Siap digunakan' : 'Dalam pemeliharaan'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant={room.isActive ? "outline" : "default"}
                      size="sm"
                      disabled={togglingRoomId === room.id}
                      onClick={() => handleToggle(room)}
                      className={cn(
                        "h-7 text-xs font-semibold gap-1.5 shrink-0 transition-all shadow-2xs",
                        room.isActive
                          ? "border-amber-400 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      {togglingRoomId === room.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : room.isActive ? (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Set Maintenance</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">Ketersediaan:</span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        room.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {room.isActive ? 'Siap Digunakan' : 'Pemeliharaan'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Tambah Ruangan Baru */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Ruang Rapat Baru"
      >
        <form onSubmit={handleSaveNewRoom} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Nama Ruangan</label>
            <Input
              required
              placeholder="Contoh: Ruang Rapat Khusus Blok B"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Lokasi Gedung & Lantai</label>
              <Input
                required
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Kapasitas (Orang)</label>
              <Input
                type="number"
                required
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Fasilitas (Pisahkan dengan koma)</label>
            <Input
              value={newFacilities}
              onChange={(e) => setNewFacilities(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Deskripsi / Peruntukan</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ruangan pertemuan teknis kedinasan..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Dibatalkan',
                  description: 'Penambahan ruangan baru dibatalkan.',
                  variant: 'info',
                });
                setIsAddModalOpen(false);
              }}
            >
              Batal
            </Button>
            <Button type="submit" size="sm">
              Simpan Ruangan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
