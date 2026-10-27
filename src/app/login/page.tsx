'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useAuth } from '../../presentation/context/AuthContext';
import { useToast } from '../../presentation/context/ToastContext';
import { UserRole, UserProfile } from '../../domain/entities/UserProfile';
import { getUserRepository, getNotificationRepository } from '../../infrastructure/repositories';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '../../presentation/components/ui/alert';
import {
  getUserPassword,
  recordPasswordResetRequest,
} from '../../lib/auth-passwords';

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

  // Mode: 'login' | 'forgot'
  const [view, setView] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    try {
      // 1. Fetch live users from repository (Supabase or Mock) to support newly created users
      const userRepo = getUserRepository();
      const liveUsers = await userRepo.getAllUsers();

      // Find in live database users
      const dbMatch = liveUsers.find(
        (u) =>
          u.email.toLowerCase() === inputEmail ||
          (u.phoneNumber && u.phoneNumber === inputEmail)
      );

      // Find in hardcoded OFFICIAL_ACCOUNTS (for aliases / backwards compatibility)
      const officialMatch = OFFICIAL_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === inputEmail ||
          acc.aliases.some((a) => a.toLowerCase() === inputEmail)
      );

      if (!dbMatch && !officialMatch) {
        setErrorMessage('Email kedinasan tidak terdaftar dalam sistem E-Reservasi Walikota.');
        toast({
          title: 'Akses Ditolak',
          description: 'Email kedinasan tidak ditemukan dalam basis data pengguna.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check account status if from database
      if (dbMatch && !dbMatch.isActive) {
        setErrorMessage('Akun kedinasan Anda berstatus non-aktif. Silakan hubungi Administrator Kominfotik.');
        toast({
          title: 'Akun Non-Aktif',
          description: 'Akun telah dinonaktifkan oleh Administrator.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Validate Password:
      // Uses getUserPassword (checks localStorage or defaults to 'walikota2026' or official account password)
      const targetEmail = dbMatch ? dbMatch.email : officialMatch!.email;
      const expectedPassword = getUserPassword(targetEmail);
      const officialPassword = officialMatch?.password || 'walikota2026';

      const isPasswordCorrect =
        inputPass === expectedPassword || inputPass === officialPassword;

      if (!isPasswordCorrect) {
        setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
        toast({
          title: 'Gagal Masuk',
          description: 'Kombinasi email dan kata sandi tidak valid. Akses ditolak.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Otentikasi Berhasil: Konstruksi profile pengguna
      const activeUser: UserProfile = dbMatch || {
        id: officialMatch!.id,
        fullName: officialMatch!.fullName,
        email: officialMatch!.email,
        unitName: officialMatch!.unitName,
        role: officialMatch!.role,
        userType: officialMatch!.userType,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Simpan session
      login(activeUser);

      toast({
        title: 'Otentikasi Berhasil',
        description: `Selamat datang, ${activeUser.fullName}.`,
        variant: 'success',
      });

      // Tentukan rute default berdasarkan role
      const defaultRoute =
        activeUser.role === 'admin'
          ? '/dashboard'
          : activeUser.role === 'verifikator_asisten' || activeUser.role === 'verifikator_pimpinan'
          ? '/verifikasi'
          : '/dashboard';

      const redirectTarget = searchParams.get('redirect');
      const destination =
        redirectTarget && !redirectTarget.startsWith('/login')
          ? redirectTarget
          : defaultRoute;

      setTimeout(() => {
        router.push(destination);
      }, 400);
    } catch (err: any) {
      console.error('Error during login', err);
      setErrorMessage('Terjadi gangguan jaringan atau server. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForgotEmail = (forgotEmail || email).trim().toLowerCase();

    if (!cleanForgotEmail) {
      toast({
        title: 'Email Diperlukan',
        description: 'Silakan ketikkan alamat email instansi Anda.',
        variant: 'destructive',
      });
      return;
    }

    setIsForgotSubmitting(true);

    try {
      // 1. Simpan permintaan reset sandi ke sistem
      recordPasswordResetRequest(cleanForgotEmail);

      // 2. Buat notifikasi khusus role Admin
      const notifRepo = getNotificationRepository();
      await notifRepo.createNotification({
        recipientId: 'admin',
        title: 'Permintaan Reset Kata Sandi',
        message: `Pengguna dengan email ${cleanForgotEmail} mengajukan permohonan pemulihan kata sandi kedinasan.`,
        type: 'warning',
      });

      setForgotSuccess(true);
      toast({
        title: 'Permintaan Terkirim',
        description: 'Permintaan reset sandi berhasil diteruskan ke Administrator Kominfotik.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error sending reset request', err);
      setForgotSuccess(true);
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors">
      {/* 2-COLUMN UNIFIED CARD (Matches mockup 100%) */}
      <div className="w-full max-w-4xl bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all">
        {/* LEFT COLUMN: Modern Corridor Image with Sudin Kominfotik Branding */}
        <div className="hidden md:flex md:w-1/2 relative bg-zinc-950 overflow-hidden min-h-[560px]">
          <img
            src="/login-bg-hd.png"
            alt="Sistem Manajemen Reservasi"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* RIGHT COLUMN: Interactive Form Content */}
        <div className="w-full md:w-1/2 bg-card p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Mobile Header Logo for smaller screens */}
            <div className="md:hidden flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
              <img
                src="/logo-kominfotik.png"
                alt="Sudin Kominfotik"
                className="h-10 w-auto object-contain dark:hidden"
              />
              <img
                src="/logo-kominfotik-dark.png"
                alt="Sudin Kominfotik"
                className="h-10 w-auto object-contain hidden dark:block"
              />
              <div>
                <div className="text-xs font-bold text-foreground">Sudin Kominfotik</div>
                <div className="text-[10px] text-muted-foreground">Jakarta Timur</div>
              </div>
            </div>

            {view === 'login' ? (
              /* LOGIN VIEW */
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Selamat Datang
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Silakan masuk ke dashboard internal.
                  </p>
                </div>

                {/* Shadcn Alert for Error */}
                {errorMessage && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Gagal Masuk</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Instansi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Instansi<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="nama@jakarta.go.id"
                      className="h-11 rounded-lg text-xs sm:text-sm border-blue-500/40 focus-visible:border-blue-600 focus-visible:ring-blue-500"
                      autoComplete="username"
                      required
                    />
                  </div>

                  {/* Kata Sandi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Kata Sandi<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="••••••••"
                        className="h-11 rounded-lg pr-10 text-xs sm:text-sm font-mono border-border/80 focus-visible:border-blue-600 focus-visible:ring-blue-500"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Ingat Saya & Lupa Sandi Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-foreground">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        disabled={isSubmitting}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs text-muted-foreground">Ingat saya</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setErrorMessage(null);
                        setForgotEmail(email);
                        setForgotSuccess(false);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Lupa Sandi?
                    </button>
                  </div>

                  {/* Button Masuk Dashboard */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm gap-2 mt-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span>Memverifikasi Akses Masuk...</span>
                      </>
                    ) : (
                      <span>Masuk Dashboard</span>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              /* PEMULIHAN SANDI (LUPA SANDI) VIEW */
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Pemulihan Sandi
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Masukkan email instansi untuk menerima tautan reset.
                  </p>
                </div>

                {/* Shadcn Alert: Info Banner */}
                <Alert
                  variant="info"
                  className="mb-5 bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300"
                >
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs leading-relaxed">
                    Permintaan reset sandi akan diteruskan langsung ke Administrator Sudin Kominfotik untuk verifikasi keamanan dan penerbitan sandi baru akun kedinasan Anda.
                  </AlertDescription>
                </Alert>

                {forgotSuccess ? (
                  <div className="space-y-4 pt-2">
                    <Alert variant="success">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <AlertTitle>Permintaan Diterima</AlertTitle>
                      <AlertDescription>
                        Permintaan reset kata sandi untuk <span className="font-mono font-bold">{forgotEmail}</span> telah dikirim ke Administrator. Admin akan mereset dan mengabari Anda.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 text-xs font-semibold"
                      onClick={() => {
                        setView('login');
                        setForgotSuccess(false);
                      }}
                    >
                      ← Kembali ke Halaman Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSendResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Email Instansi / Terdaftar<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <Input
                        type="email"
                        value={forgotEmail}
                        disabled={isForgotSubmitting}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@jakarta.go.id"
                        className="h-11 rounded-lg text-xs sm:text-sm border-blue-500/40 focus-visible:border-blue-600 focus-visible:ring-blue-500"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isForgotSubmitting}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm gap-2 mt-2 transition-all"
                    >
                      {isForgotSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                          <span>Meneruskan Permintaan...</span>
                        </>
                      ) : (
                        <span>Kirim Permintaan Reset</span>
                      )}
                    </Button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setView('login');
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Halaman Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Unified Footer Copyright */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              &copy; 2026 Suku Dinas Kominfotik<br />
              Kota Administrasi Jakarta Timur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50/50 dark:bg-background" />}>
      <LoginFormContent />
    </React.Suspense>
  );
}
