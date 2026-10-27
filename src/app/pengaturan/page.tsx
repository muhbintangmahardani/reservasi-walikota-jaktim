'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Building,
  Shield,
  Phone,
  KeyRound,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../presentation/context/AuthContext';
import { useToast } from '../../presentation/context/ToastContext';
import { getUserRepository } from '../../infrastructure/repositories';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../presentation/components/ui/card';
import { Badge } from '../../presentation/components/ui/badge';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '../../presentation/components/ui/alert';
import { getUserPassword, setUserPassword } from '../../lib/auth-passwords';

export default function PengaturanProfilPage() {
  const router = useRouter();
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const { toast } = useToast();

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userRepo = getUserRepository();

  if (!currentUser) {
    return (
      <div className="w-full space-y-6 pb-12">
        <div className="pb-3 border-b border-border/60">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Pengaturan Akun & Profil
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Memuat profil pengguna...
          </p>
        </div>
      </div>
    );
  }

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhone(true);
    setPhoneMessage(null);

    try {
      const cleanPhone = phoneNumber.trim();
      await userRepo.updateUser(currentUser.id, { phoneNumber: cleanPhone });
      updateCurrentUser({ phoneNumber: cleanPhone });

      setPhoneMessage({
        type: 'success',
        text: 'Nomor telepon / kontak WhatsApp kedinasan berhasil diperbarui.',
      });
      toast({
        title: 'Kontak Diperbarui',
        description: 'Nomor telepon WhatsApp berhasil disimpan ke basis data.',
        variant: 'success',
      });
    } catch (err: any) {
      setPhoneMessage({
        type: 'error',
        text: err?.message || 'Gagal menyimpan nomor telepon. Silakan coba lagi.',
      });
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat memperbarui nomor telepon.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPass(true);
    setPassMessage(null);

    // 1. Verify current password
    const savedPass = getUserPassword(currentUser.email);
    if (currentPassword !== savedPass) {
      setPassMessage({
        type: 'error',
        text: 'Kata sandi saat ini tidak sesuai. Silakan periksa kembali.',
      });
      setIsSavingPass(false);
      return;
    }

    // 2. Validate new password length
    if (newPassword.length < 6) {
      setPassMessage({
        type: 'error',
        text: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
      });
      setIsSavingPass(false);
      return;
    }

    // 3. Validate confirmation
    if (newPassword !== confirmPassword) {
      setPassMessage({
        type: 'error',
        text: 'Konfirmasi kata sandi baru tidak cocok.',
      });
      setIsSavingPass(false);
      return;
    }

    // 4. Save new password
    setUserPassword(currentUser.email, newPassword);
    setPassMessage({
      type: 'success',
      text: 'Kata sandi kedinasan Anda berhasil diperbarui!',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSavingPass(false);

    toast({
      title: 'Kata Sandi Diperbarui',
      description: 'Sandi akun kedinasan telah diperbarui secara aman.',
      variant: 'success',
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Berhasil Keluar',
      description: 'Sesi akun Anda telah diakhiri dengan aman.',
      variant: 'info',
    });
    router.push('/login');
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Pengaturan Akun & Profil
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informasi identitas akun kedinasan, kontak resmi, keamanan kata sandi, dan manajemen sesi.
          </p>
        </div>

        {/* Tombol Keluar Cepat */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 h-8 text-xs font-semibold self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Akun
        </Button>
      </div>

      {/* Profil Ringkas Card (Full Width) */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-base text-foreground truncate">{currentUser.fullName}</h2>
              <p className="text-xs text-muted-foreground truncate">{currentUser.unitName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-mono capitalize">
                  {currentUser.role.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {currentUser.userType}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[10px] mb-1 font-medium">Email Kedinasan Resmi:</span>
              <span className="font-semibold text-foreground font-mono text-xs">{currentUser.email}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[10px] mb-1 font-medium">Unit Kerja / OPD:</span>
              <span className="font-semibold text-foreground text-xs">{currentUser.unitName}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[10px] mb-1 font-medium">Hak Akses Sistem:</span>
              <span className="font-semibold text-foreground capitalize text-xs">{currentUser.role.replace('_', ' ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Responsive Grid for Phone & Password Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ubah Nomor Telepon (WhatsApp) */}
        <Card className="border border-border/70 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Kontak WhatsApp Kedinasan</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Nomor ini digunakan sebagai kontak PIC untuk koordinasi peminjaman dan verifikasi ruangan rapat.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {phoneMessage && (
                <Alert
                  variant={phoneMessage.type === 'success' ? 'success' : 'destructive'}
                  className="mb-4"
                >
                  {phoneMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <AlertTitle>
                    {phoneMessage.type === 'success' ? 'Berhasil' : 'Peringatan'}
                  </AlertTitle>
                  <AlertDescription>{phoneMessage.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSavePhone} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nomor Telepon / WhatsApp</label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    className="text-xs h-9"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan nomor aktif yang terhubung dengan WhatsApp untuk konfirmasi otomatis.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={isSavingPhone} className="gap-1.5 text-xs">
                    <Save className="w-3.5 h-3.5" />
                    {isSavingPhone ? 'Menyimpan...' : 'Simpan Nomor Telepon'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </Card>

        {/* Ganti Kata Sandi */}
        <Card className="border border-border/70 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Keamanan & Ganti Kata Sandi</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Perbarui kata sandi akun kedinasan Anda secara berkala untuk menjaga keamanan data reservasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {passMessage && (
                <Alert
                  variant={passMessage.type === 'success' ? 'success' : 'destructive'}
                  className="mb-4"
                >
                  {passMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <AlertTitle>
                    {passMessage.type === 'success' ? 'Berhasil' : 'Kesalahan Validasi'}
                  </AlertTitle>
                  <AlertDescription>{passMessage.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Sandi Saat Ini */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Kata Sandi Saat Ini</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className="text-xs h-9 pr-9 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sandi Baru */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Kata Sandi Baru</label>
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="text-xs h-9 pr-9 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Konfirmasi Kata Sandi Baru</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={isSavingPass} className="gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5" />
                    {isSavingPass ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Sesi & Logout Section (Full Width) */}
      <Card className="border border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400">Keluar dari Sesi Kedinasan</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Akhiri sesi aktif Anda di komputer ini untuk memastikan privasi data dan keamanan akun tetap terjaga.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="gap-2 shrink-0 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sistem
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
