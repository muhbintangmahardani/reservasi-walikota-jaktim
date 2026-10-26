'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Users,
  Shirt,
  FileText,
  Edit,
  Tag,
  AlertCircle,
  Send,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Reservation } from '../../../domain/entities/Reservation';
import { useReservations } from '../../context/ReservationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export const ApprovalDashboard: React.FC = () => {
  const { reservations, categories, approveReservation, rejectReservation, updateReservation, isLoading } = useReservations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'menunggu' | 'disetujui' | 'ditolak'>('menunggu');

  // Modals state
  const [approvingItem, setApprovingItem] = useState<Reservation | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [rejectingItem, setRejectingItem] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [editingItem, setEditingItem] = useState<Reservation | null>(null);
  const [editExecutor, setEditExecutor] = useState('');
  const [editAccompanying, setEditAccompanying] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDressCode, setEditDressCode] = useState('');

  const isAsisten = currentUser?.role === 'verifikator_asisten';

  const filteredList = reservations.filter((r) => r.status === activeTab);

  const handleOpenApproveModal = (res: Reservation) => {
    setApprovingItem(res);
    setSelectedCategoryId(categories[0]?.id || '');
    setCustomCategoryName('');
  };

  const handleConfirmApprove = async () => {
    if (!approvingItem) return;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    const catName = selectedCategoryId === 'custom' ? customCategoryName : cat?.name || 'Kegiatan Kedinasan';

    await approveReservation(approvingItem.id, selectedCategoryId, catName);
    toast({
      title: 'Reservasi Disetujui!',
      description: `Agenda "${approvingItem.eventName}" disetujui dengan kategori ${catName}. Jadwal resmi telah diblock di kalender.`,
      variant: 'success',
    });
    setApprovingItem(null);
  };

  const handleOpenRejectModal = (res: Reservation) => {
    setRejectingItem(res);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem || !rejectionReason.trim()) return;
    await rejectReservation(rejectingItem.id, rejectionReason.trim());
    toast({
      title: 'Reservasi Ditolak',
      description: `Pengajuan ruangan "${rejectingItem.eventName}" telah ditolak. Alasan: ${rejectionReason.trim()}`,
      variant: 'destructive',
    });
    setRejectingItem(null);
  };

  const handleOpenEditModal = (res: Reservation) => {
    setEditingItem(res);
    setEditExecutor(res.executorOfficial || '');
    setEditAccompanying(res.accompanyingOfficial || '');
    setEditEventName(res.eventName);
    setEditStartTime(res.startTime);
    setEditEndTime(res.endTime);
    setEditDressCode(res.dressCode || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    let updateData: Partial<Reservation> = {};
    let notifyMsg = '';

    if (isAsisten) {
      updateData = {
        executorOfficial: editExecutor,
        accompanyingOfficial: editAccompanying,
      };
      notifyMsg = `Asisten (${currentUser?.fullName || 'Asisten'}) telah memperbarui penugasan Pejabat Pelaksana: "${editExecutor}" dan Pendamping: "${editAccompanying}" untuk "${editingItem.eventName}".`;
    } else {
      updateData = {
        eventName: editEventName,
        startTime: editStartTime,
        endTime: editEndTime,
        executorOfficial: editExecutor,
        accompanyingOfficial: editAccompanying,
        dressCode: editDressCode,
      };
      notifyMsg = `Pimpinan (${currentUser?.fullName || 'Pimpinan'}) telah memperbarui detail agenda "${editEventName}".`;
    }

    await updateReservation(editingItem.id, updateData, notifyMsg);
    toast({
      title: 'Perubahan Disimpan',
      description: 'Detail pejabat dan jadwal kegiatan berhasil diperbarui.',
      variant: 'success',
    });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Verifikasi & Approval Sekpim
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Otoritas saat ini:{' '}
            <span className="font-medium text-foreground">
              {isAsisten
                ? 'Asisten (Verifikasi + Edit Pejabat Pelaksana & Pendamping)'
                : 'Pimpinan / Admin (Otoritas Penuh Seluruh Field)'}
            </span>
          </p>
        </div>

        {/* Minimalist Tabs with safe responsive scrolling */}
        <div className="overflow-x-auto pb-1 max-w-full">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 min-w-max">
            <Button
              variant={activeTab === 'menunggu' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('menunggu')}
              className="h-7 text-xs px-3"
            >
              Menunggu ({reservations.filter((r) => r.status === 'menunggu').length})
            </Button>
            <Button
              variant={activeTab === 'disetujui' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('disetujui')}
              className="h-7 text-xs px-3"
            >
              Disetujui ({reservations.filter((r) => r.status === 'disetujui').length})
            </Button>
            <Button
              variant={activeTab === 'ditolak' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('ditolak')}
              className="h-7 text-xs px-3"
            >
              Ditolak ({reservations.filter((r) => r.status === 'ditolak').length})
            </Button>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-5 w-2/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">Tidak ada agenda pada status ini</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Semua permohonan telah ditangani.</p>
            </CardContent>
          </Card>
        ) : (
          filteredList.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-border">
              <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        item.status === 'disetujui'
                          ? 'success'
                          : item.status === 'menunggu'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {item.status}
                    </Badge>
                    <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-md">
                      {item.roomName}
                    </span>
                    {item.categoryName && (
                      <Badge variant="neutral" className="text-[10px]">
                        Label: {item.categoryName}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{item.eventName}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pemohon: <span className="font-medium text-foreground">{item.userName}</span> ({item.letterOrigin})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>
                        {format(parseISO(item.eventDate), 'dd MMM yyyy', { locale: localeId })} | {item.startTime} - {item.endTime} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">Pelaksana: {item.executorOfficial || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">Pendamping: {item.accompanyingOfficial || '-'}</span>
                    </div>
                  </div>

                  {item.rejectionReason && (
                    <div className="p-2.5 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-[11px] text-red-800 dark:text-red-300">
                      <span className="font-semibold">Alasan Penolakan: </span>
                      {item.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                  {item.status === 'menunggu' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleOpenApproveModal(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Setujui
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRejectModal(item)}
                        className="text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Tolak
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(item)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    {isAsisten ? 'Edit Pejabat' : 'Edit Agenda'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* MODAL 1: PERSETUJUAN (INPUT LABEL KATEGORI) */}
      <Dialog
        isOpen={!!approvingItem}
        onClose={() => setApprovingItem(null)}
        title="Persetujuan Reservasi Ruangan"
        description="Pilih label kategori kegiatan untuk agenda pimpinan pada kalender."
      >
        {approvingItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
              <p className="font-semibold text-foreground">{approvingItem.eventName}</p>
              <p className="text-muted-foreground">{approvingItem.roomName} • {approvingItem.eventDate} ({approvingItem.startTime} - {approvingItem.endTime} WIB)</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Label Kategori Kegiatan *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="custom">Kategori Lainnya (Tulis Bebas)</option>
              </select>

              {selectedCategoryId === 'custom' && (
                <Input
                  type="text"
                  required
                  placeholder="Ketikkan nama label kategori..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setApprovingItem(null)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleConfirmApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Submit & Setujui
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 2: PENOLAKAN (POP-UP ALASAN) */}
      <Dialog
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Penolakan Reservasi Ruangan"
        description="Cantumkan alasan resmi penolakan yang akan dikirimkan ke pemohon."
      >
        {rejectingItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
              <p className="font-semibold text-foreground">{rejectingItem.eventName}</p>
              <p className="text-muted-foreground">Pemohon: {rejectingItem.userName} ({rejectingItem.letterOrigin})</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Alasan Penolakan *</label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Jadwal bentrok dengan agenda mendadak Walikota..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectionReason.trim()}
                onClick={handleConfirmReject}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Submit Penolakan
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 3: EDIT RESERVASI (DENGAN RESTRIKSI ROLE ASISTEN VS PIMPINAN) */}
      <Dialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Sunting Rincian Agenda"
        description={
          isAsisten
            ? 'Role Asisten: Hanya kolom Pejabat Pelaksana & Pendamping yang aktif diedit'
            : 'Role Pimpinan / Admin: Akses penuh mengubah seluruh data'
        }
      >
        {editingItem && (
          <div className="space-y-4 text-xs">
            {isAsisten && (
              <div className="p-2.5 rounded-md border border-amber-200 bg-amber-50 text-[11px] text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Otoritas Asisten terbatas pada penugasan pejabat pelaksana dan pendamping.</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-muted-foreground">Nama Acara</label>
                <Input
                  disabled={isAsisten}
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-muted-foreground">Jam Mulai</label>
                  <Input
                    type="time"
                    disabled={isAsisten}
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground">Jam Selesai</label>
                  <Input
                    type="time"
                    disabled={isAsisten}
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Pejabat Pelaksana & Pendamping (Selalu aktif) */}
              <div className="p-3 rounded-md bg-muted/40 border border-border/80 space-y-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Pejabat Pelaksana * (Aktif)</label>
                  <Input
                    required
                    value={editExecutor}
                    onChange={(e) => setEditExecutor(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Pejabat Pendamping (Aktif)</label>
                  <Input
                    value={editAccompanying}
                    onChange={(e) => setEditAccompanying(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Pakaian (Dress Code)</label>
                <Input
                  disabled={isAsisten}
                  value={editDressCode}
                  onChange={(e) => setEditDressCode(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
