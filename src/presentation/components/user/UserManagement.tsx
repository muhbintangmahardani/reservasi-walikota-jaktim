'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { UserProfile, UserRole, UserType } from '../../../domain/entities/UserProfile';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUserRepository } from '../../../infrastructure/repositories';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';

export const UserManagement: React.FC = () => {
  const { allUsers } = useAuth();
  const { toast } = useToast();
  const [usersList, setUsersList] = useState<UserProfile[]>(allUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState('');
  const [unitName, setUnitName] = useState('Bagian Pemerintahan');
  const [role, setRole] = useState<UserRole>('user_bagian');
  const [userType, setUserType] = useState<UserType>('internal');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const userRepo = getUserRepository();

  const refreshUsers = async () => {
    setIsRefreshing(true);
    const list = await userRepo.getAllUsers();
    setUsersList(list);
    setIsRefreshing(false);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setUnitName('Bagian Pemerintahan');
    setRole('user_bagian');
    setUserType('internal');
    setEmail('');
    setPhoneNumber('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUnitName(u.unitName);
    setRole(u.role);
    setUserType(u.userType);
    setEmail(u.email);
    setPhoneNumber(u.phoneNumber || '');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await userRepo.updateUser(editingUser.id, {
        fullName,
        unitName,
        role,
        userType,
        email,
        phoneNumber,
      });
      toast({
        title: 'Pengguna Berhasil Diperbarui',
        description: `Data akun ${fullName} telah disimpan.`,
        variant: 'success',
      });
    } else {
      await userRepo.createUser({
        fullName,
        unitName,
        role,
        userType,
        email,
        phoneNumber,
        isActive: true,
      });
      toast({
        title: 'Pengguna Berhasil Ditambahkan',
        description: `Akun baru ${fullName} telah didaftarkan ke sistem.`,
        variant: 'success',
      });
    }
    await refreshUsers();
    setIsModalOpen(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Hapus pengguna ini dari sistem?')) {
      await userRepo.deleteUser(id);
      await refreshUsers();
      toast({
        title: 'Pengguna Dihapus',
        description: 'Akun pegawai telah dihapus dari sistem.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    await userRepo.toggleUserStatus(id);
    await refreshUsers();
    toast({
      title: 'Status Pengguna Diperbarui',
      description: 'Status akun pengguna telah diubah.',
      variant: 'info',
    });
  };

  const handleResetPassword = (u: UserProfile) => {
    toast({
      title: 'Tautan Reset Terkirim',
      description: `Instruksi pemulihan kata sandi telah dikirim ke: ${u.email}`,
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Kelola Pengguna Sistem
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen akun pegawai perangkat daerah dan hak akses sistem (Admin Kominfotik).
          </p>
        </div>

        <Button size="sm" onClick={handleOpenAddModal}>
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Users Table with isolated horizontal scroll */}
      <Card className="overflow-hidden border border-border shadow-xs">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pengguna</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead>Peran (Role)</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRefreshing ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              usersList.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">{user.fullName}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{user.unitName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === 'admin'
                        ? 'default'
                        : user.role === 'verifikator_pimpinan'
                        ? 'neutral'
                        : user.role === 'verifikator_asisten'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="capitalize text-[11px] text-muted-foreground">{user.userType}</span>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                  >
                    {user.isActive ? (
                      <Badge variant="success" className="text-[10px] cursor-pointer">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] cursor-pointer">
                        Non-Aktif
                      </Badge>
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleOpenEditModal(user)}
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleResetPassword(user)}
                      title="Reset Kata Sandi"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Hapus"
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </Card>

      {/* MODAL USER ADD / EDIT */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
        description="Lengkapi informasi akun kedinasan dan role wewenang sistem."
      >
        <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-muted-foreground font-medium">Nama Lengkap & Gelar *</label>
            <Input
              required
              placeholder="Contoh: Ahmad Fauzi, S.STP"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-muted-foreground font-medium">Unit Kerja / Bagian *</label>
            <Input
              required
              placeholder="Contoh: Bagian Pemerintahan"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-muted-foreground font-medium">Peran (Role) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="user_bagian">User Bagian</option>
                <option value="verifikator_asisten">Verifikator (Asisten)</option>
                <option value="verifikator_pimpinan">Verifikator (Pimpinan)</option>
                <option value="admin">Admin (Kominfotik)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-medium">Tipe Pengguna *</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="internal">Internal (Pemkot)</option>
                <option value="eksternal">Eksternal</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-muted-foreground font-medium">Alamat Email Resmi *</label>
            <Input
              type="email"
              required
              placeholder="nama@jakarta.go.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-muted-foreground font-medium">Nomor Telepon / WhatsApp</label>
            <Input
              placeholder="0812xxxxxxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm">
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
