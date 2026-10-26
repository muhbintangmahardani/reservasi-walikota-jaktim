'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../presentation/context/AuthContext';
import { useToast } from '../../presentation/context/ToastContext';
import { UserRole, UserProfile } from '../../domain/entities/UserProfile';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../presentation/components/ui/card';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Dialog } from '../../presentation/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RegisteredAccount {
  id: string;
  email: string;
  aliases: string[];
  password: string;
  role: UserRole;
  fullName: string;
  unitName: string;
  userType: 'internal' | 'eksternal';
  defaultRoute: string;
  badgeLabel: string;
}

const OFFICIAL_ACCOUNTS: RegisteredAccount[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    email: 'budi@jakarta.go.id',
    aliases: ['fauzi.pemerintahan@jakarta.go.id', 'pemerintahan@jakarta.go.id'],
    password: 'walikota2026',
    role: 'user_bagian',
    fullName: 'Budi Setiawan',
    unitName: 'Bagian Pemerintahan',
    userType: 'internal',
    defaultRoute: '/dashboard',
    badgeLabel: 'OPD Pemohon',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    email: 'aspem@jakarta.go.id',
    aliases: ['asisten.ekbang@jakarta.go.id', 'asisten@jakarta.go.id', 'fauzi@jakarta.go.id'],
    password: 'walikota2026',
    role: 'verifikator_asisten',
    fullName: 'Drs. H. Ahmad Fauzi, M.Si',
    unitName: 'Asisten Pemerintahan (Aspem)',
    userType: 'internal',
    defaultRoute: '/verifikasi',
    badgeLabel: 'Sekpim Asisten',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    email: 'walikota@jakarta.go.id',
    aliases: ['sekpim.walikota@jakarta.go.id', 'pimpinan@jakarta.go.id', 'anwar@jakarta.go.id'],
    password: 'walikota2026',
    role: 'verifikator_pimpinan',
    fullName: 'M. Anwar, S.Si, M.AP',
    unitName: 'Walikota Kota Administrasi Jakarta Timur',
    userType: 'internal',
    defaultRoute: '/verifikasi',
    badgeLabel: 'Sekpim Pimpinan',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    email: 'admin.kominfotik@jakarta.go.id',
    aliases: ['admin@jakarta.go.id', 'kominfotik@jakarta.go.id'],
    password: 'walikota2026',
    role: 'admin',
    fullName: 'Siti Rahmawati, S.Kom',
    unitName: 'Suku Dinas Kominfotik Jakarta Timur',
    userType: 'internal',
    defaultRoute: '/dashboard',
    badgeLabel: 'Admin Kominfotik',
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allUsers, login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Handle middleware redirect warnings
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized_verifikator') {
      setErrorMessage('Akses ditolak: Anda tidak memiliki izin untuk membuka Meja Verifikasi Sekpim.');
    } else if (errorParam === 'unauthorized_admin') {
      setErrorMessage('Akses ditolak: Halaman Manajemen Pengguna hanya dapat diakses oleh Admin Kominfotik.');
    } else if (searchParams.get('redirect')) {
      setErrorMessage('Sesi kedaluwarsa atau belum login. Silakan masuk terlebih dahulu.');
    }
  }, [searchParams]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputEmail) {
      setErrorMessage('Silakan masukkan email kedinasan Anda.');
      return;
    }
    if (!inputPass) {
      setErrorMessage('Silakan masukkan kata sandi akun.');
      return;
    }

    // 1. Search account in registered list or allUsers
    const matched = OFFICIAL_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === inputEmail ||
        acc.aliases.some((a) => a.toLowerCase() === inputEmail)
    );

    // If account doesn't exist at all
    if (!matched) {
      setErrorMessage('Email kedinasan tidak terdaftar dalam sistem E-Reservasi Walikota.');
      toast({
        title: 'Akses Ditolak',
        description: 'Email kedinasan tidak ditemukan dalam basis data pengguna.',
        variant: 'destructive',
      });
      return;
    }

    // 2. STRICT PASSWORD VALIDATION (Blocks asal-asalan passwords)
    if (inputPass !== matched.password) {
      setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
      toast({
        title: 'Gagal Masuk',
        description: 'Kombinasi email dan kata sandi tidak valid. Akses ditolak.',
        variant: 'destructive',
      });
      return;
    }

    // 3. Valid Credentials -> Trigger Button Spinner & Transition
    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching user from allUsers or construct full profile
      const userFromDb = allUsers.find((u) => u.id === matched.id || u.email.toLowerCase() === matched.email.toLowerCase());
      const activeUser: UserProfile = userFromDb || {
        id: matched.id,
        fullName: matched.fullName,
        email: matched.email,
        unitName: matched.unitName,
        role: matched.role,
        userType: matched.userType,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Set session in AuthContext & Cookies
      login(activeUser);

      toast({
        title: 'Otentikasi Berhasil',
        description: `Selamat datang, ${matched.fullName} (${matched.badgeLabel}).`,
        variant: 'success',
      });

      // Redirect target: check if there's a redirect query param from middleware
      const redirectTarget = searchParams.get('redirect');
      const destination = redirectTarget && !redirectTarget.startsWith('/login')
        ? redirectTarget
        : matched.defaultRoute;

      router.push(destination);
    }, 700);
  };

  const handleSendResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotOpen(false);
    toast({
      title: 'Tautan Reset Terkirim',
      description: `Instruksi pemulihan kata sandi telah dikirim ke email ${forgotEmail || email}.`,
      variant: 'info',
    });
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center space-y-3 mb-6">
        <div className="flex justify-center items-center">
          <img
            src="/logo-kominfotik.png"
            alt="Logo Sudin Kominfotik Jakarta Timur"
            className="h-16 w-auto object-contain dark:hidden"
          />
          <img
            src="/logo-kominfotik-dark.png"
            alt="Logo Sudin Kominfotik Jakarta Timur"
            className="h-16 w-auto object-contain hidden dark:block"
          />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            E-Reservasi Ruang Rapat
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kantor Walikota Kota Administrasi Jakarta Timur &bull; Portal Resmi Penjadwalan Terpadu
          </p>
        </div>
      </div>

      {/* SINGLE PAGE UNIFIED LOGIN CARD */}
      <Card className="w-full max-w-md border border-border/80 shadow-xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Masuk ke Akun Kedinasan</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Gunakan email dan kata sandi resmi untuk melanjutkan.
              </CardDescription>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-5 space-y-4">
          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Email Kedinasan</label>
                <span className="text-[10px] text-muted-foreground font-mono">domain: @jakarta.go.id</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="budi@jakarta.go.id"
                  className="pl-9 text-xs h-10"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input with Strict Validation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan kata sandi akun"
                  className="pl-9 pr-10 text-xs h-10 font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isSubmitting}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input text-foreground focus:ring-ring"
                />
                <span className="text-muted-foreground text-xs">Ingat sesi di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button with Live Spinner Animation */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 text-xs font-semibold gap-2 mt-2 shadow-xs transition-all relative"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-foreground shrink-0" />
                  <span>Memverifikasi Akses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem E-Reservasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center mt-5">
        Sistem Informasi Pengelolaan Ruang Rapat &bull; Pemkot Jakarta Timur
      </p>

      {/* Forgot Password Modal */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Pemulihan Kata Sandi Akun Kedinasan"
      >
        <form onSubmit={handleSendResetPassword} className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Masukkan email kedinasan terdaftar Anda (@jakarta.go.id). Tautan verifikasi reset kata sandi akan dikirimkan secara otomatis.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email Kedinasan</label>
            <Input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="budi@jakarta.go.id"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm">
              Kirim Tautan Reset
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-muted/20 dark:bg-background" />}>
      <LoginFormContent />
    </React.Suspense>
  );
}
