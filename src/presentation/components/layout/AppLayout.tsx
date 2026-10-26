'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  History,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Users,
  Bell,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Building,
  Check,
  PanelLeft,
  PanelLeftClose,
  Search,
  Moon,
  Sun,
  Clock,
  Sparkles,
  LogOut,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReservations } from '../../context/ReservationContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../../domain/entities/UserProfile';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Breadcrumb, BreadcrumbItem } from '../ui/breadcrumb';
import { GlobalSearchDialog } from '../search/GlobalSearchDialog';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const {
    reservations,
    notifications,
    unreadNotifsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isBackendConnected,
  } = useReservations();

  // Collapsible Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme state (Dark Mode by default matching Shadcn Admin reference)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('e_reservasi_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('e_reservasi_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Protect routes: Redirect to /login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('e_reservasi_sidebar_collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Global search shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Page Title mapping function
  const getPageTitle = (path: string): string => {
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/kalender') return 'Kalender Jadwal';
    if (path === '/jadwal-pimpinan') return 'Jadwal Pimpinan';
    if (path === '/reservasi/baru') return 'Formulir Reservasi Baru';
    if (path === '/reservasi/riwayat') return 'Riwayat Pengajuan';
    if (path === '/verifikasi') return 'Meja Verifikasi Sekpim';
    if (path === '/verifikasi/jadwal-pimpinan') return 'Jadwal Pimpinan';
    if (path === '/ruangan') return 'Data Ruang Rapat';
    if (path === '/laporan') return 'Laporan & Rekapitulasi';
    if (path.startsWith('/pengaturan/users')) return 'Manajemen Pengguna';
    if (path.startsWith('/pengaturan')) return 'Pengaturan Akun';
    return 'E-Reservasi Walikota';
  };

  // Synchronize document.title unconditionally (MUST run before any early return)
  useEffect(() => {
    const pageTitle = getPageTitle(pathname);
    document.title = `${pageTitle} | E-Reservasi Walikota Jaktim`;
  }, [pathname]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Sesi Berakhir',
      description: 'Anda telah keluar dari Sistem E-Reservasi.',
      variant: 'info',
    });
    router.push('/login');
  };

  if (pathname === '/login') {
    return <main className="min-h-screen w-full bg-background">{children}</main>;
  }

  if (!currentUser) {
    return null;
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('e_reservasi_sidebar_collapsed', String(next));
      return next;
    });
  };

  const pendingCount = reservations.filter((r) => r.status === 'menunggu').length;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin (Kominfotik)', badge: 'Admin' };
      case 'verifikator_pimpinan':
        return { label: 'Sekpim (Pimpinan)', badge: 'Pimpinan' };
      case 'verifikator_asisten':
        return { label: 'Sekpim (Asisten)', badge: 'Asisten' };
      default:
        return { label: 'User Bagian', badge: 'Bagian' };
    }
  };

  const isVerifier =
    currentUser?.role === 'verifikator_asisten' ||
    currentUser?.role === 'verifikator_pimpinan' ||
    currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  // Breadcrumbs generator: langsung dari Home ke halaman tujuan (tanpa kategori dummy)
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    return [{ label: getPageTitle(pathname), isCurrent: true }];
  };

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Nav Groups matching Shadcn Admin
  const navGroups: NavGroup[] = [
    {
      title: 'General',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/kalender', label: 'Kalender Jadwal', icon: Calendar },
        { href: '/jadwal-pimpinan', label: 'Jadwal Pimpinan', icon: Crown },
        { href: '/reservasi/baru', label: 'Buat Reservasi', icon: CalendarPlus },
        { href: '/reservasi/riwayat', label: 'Riwayat Saya', icon: History },
      ],
    },
    ...(isVerifier
      ? [
          {
            title: 'Sekretariat Pimpinan',
            items: [
              {
                href: '/verifikasi',
                label: 'Meja Verifikasi',
                icon: CheckCircle2,
                badge: pendingCount > 0 ? pendingCount : undefined,
              },
            ],
          },
        ]
      : []),
    {
      title: 'Manajemen & Laporan',
      items: [
        { href: '/ruangan', label: 'Data Ruangan', icon: Building2 },
        { href: '/laporan', label: 'Laporan & Audit', icon: FileSpreadsheet },
        ...(isAdmin
          ? [{ href: '/pengaturan/users', label: 'Kelola Pengguna', icon: Users }]
          : []),
      ],
    },
  ];

  return (
    <div className="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden">
      {/* SIDEBAR DESKTOP (Collapsible with generous spacing - Fixed to viewport) */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-card border-r border-border shrink-0 h-screen z-30 transition-all duration-200 ease-in-out",
          isSidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-border/70 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0 group">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-95">
              <img
                src="/logo-kominfotik-mark.png"
                alt="Logo Sudin Kominfotik"
                className="w-full h-full object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-semibold text-xs tracking-tight text-foreground block truncate">
                  E-Reservasi
                </span>
                <span className="text-[10px] text-muted-foreground block truncate -mt-0.5">
                  Sudin Kominfotik Jakarta Timur
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items with proper section spacing */}
        <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {!isSidebarCollapsed && (
                <div className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                  {group.title}
                </div>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg text-xs font-medium transition-colors",
                        isSidebarCollapsed
                          ? "justify-center p-2.5"
                          : "justify-between px-3 py-2",
                        isActive
                          ? "bg-zinc-900 text-zinc-50 shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-inherit" : "text-muted-foreground")} />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-semibold shrink-0",
                            isActive
                              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isSidebarCollapsed && item.badge !== undefined && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2"></span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card in Bottom Sidebar with breathing space - Fixed overlap */}
        <div className="p-2.5 border-t border-border/70 bg-muted/20">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border flex items-center justify-center font-semibold text-xs shrink-0 select-none cursor-pointer hover:border-foreground/50 transition-colors"
                title={`${currentUser?.fullName || 'Pengguna'} (${currentUser?.unitName || ''})`}
                onClick={() => router.push('/pengaturan')}
              >
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Ganti Akun"
                className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-muted/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/70">
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => router.push('/pengaturan')}
              >
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border flex items-center justify-center font-semibold text-xs shrink-0 select-none">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {currentUser?.fullName || 'Pengguna'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentUser?.unitName || 'Pemerintah Kota'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="neutral" className="text-[9px] px-1.5 py-0 uppercase">
                  {currentUser ? getRoleLabel(currentUser.role).badge : 'GUEST'}
                </Badge>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-muted/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER (Pinned header + scrollable content) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* TOP NAVBAR (Matching Shadcn Admin: Sidebar toggle + Breadcrumbs + Search with ⌘K + Role + Notif) */}
        <header className="shrink-0 h-14 bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4 z-50 relative">
          {/* Left: Sidebar Collapse Button & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="iconSm"
              onClick={toggleSidebar}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
              title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-muted-foreground"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            {/* Breadcrumb Navigation on Desktop */}
            <div className="hidden sm:block">
              <Breadcrumb items={getBreadcrumbs()} />
            </div>

            {/* Mobile / Tablet Page Title */}
            <div className="sm:hidden font-semibold text-xs text-foreground truncate max-w-[140px]">
              {getPageTitle(pathname)}
            </div>
          </div>

          {/* Right Toolbar: Global Search (⌘K), Theme Switcher, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Interactive Global Search Button with ⌘K shortcut */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="relative hidden lg:flex items-center w-52 xl:w-64 h-8 pl-8 pr-12 text-xs rounded-md border border-input bg-background/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all text-left shadow-2xs group"
              title="Cari Agenda atau Ruangan (Tekan ⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors absolute left-2.5 top-2.5" />
              <span className="truncate">Cari agenda, ruangan...</span>
              <kbd className="pointer-events-none absolute right-2 top-2 h-4 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground flex">
                ⌘K
              </kbd>
            </button>

            {/* Mobile / Tablet Search Trigger Icon */}
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              title="Cari Agenda atau Ruangan"
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Backend connection pill */}
            <div
              className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/70 text-[11px] font-mono select-none"
              title={isBackendConnected ? "Terhubung ke Supabase Cloud PostgreSQL & Realtime" : "Menggunakan Penyimpanan Lokal Mock (Offline-Ready)"}
            >
              <span className={cn("w-2 h-2 rounded-full", isBackendConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
              <span className="text-muted-foreground font-medium text-[10px]">
                {isBackendConnected ? "Live" : "Mock"}
              </span>
            </div>

            {/* THEME TOGGLE (Sun / Moon) - Shadcn Admin feature */}
            <Button
              variant="outline"
              size="iconSm"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={theme === 'dark' ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* NOTIFICATION BELL */}
            <div className="relative">
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative text-muted-foreground hover:text-foreground"
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </Button>

              {isNotifOpen && (
                <>
                  {/* Invisible Backdrop to close on outside click without blurring page */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  {/* Responsive Notification Panel: full-width bounded on mobile, anchored on desktop */}
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-auto sm:mt-2 w-auto sm:w-88 md:w-96 max-w-md sm:max-w-none mx-auto sm:mx-0 bg-card text-card-foreground rounded-lg shadow-2xl border border-border/80 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Notifikasi</p>
                        <p className="text-[10px] text-muted-foreground">{unreadNotifsCount} belum dibaca</p>
                      </div>
                      {unreadNotifsCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          className="text-[10px] text-foreground hover:underline font-medium"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">Tidak ada notifikasi</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setIsNotifOpen(false);
                            }}
                            className={cn(
                              "p-2.5 text-xs transition-colors cursor-pointer hover:bg-muted/70 rounded-md my-0.5",
                              !notif.isRead ? "bg-muted/40 font-medium" : ""
                            )}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-foreground text-[11px]">{notif.title}</span>
                              {!notif.isRead && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* USER PROFILE AVATAR (Shadcn Admin Top Right SN Circle) */}
            <div
              onClick={() => router.push('/pengaturan')}
              className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs ring-1 ring-border shadow-xs shrink-0 select-none cursor-pointer hover:opacity-90 transition-opacity"
              title={`${currentUser?.fullName || 'Pengguna'} (${currentUser?.unitName || ''}) - Pengaturan Akun`}
            >
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'WK'}
            </div>
          </div>
        </header>

        {/* MOBILE OFFCANVAS DRAWER (SLIDE IN FROM LEFT) */}
        <div
          className={cn(
            "fixed inset-0 z-50 md:hidden transition-all duration-300",
            isMobileMenuOpen ? "visible" : "invisible pointer-events-none"
          )}
        >
          {/* Backdrop Blur Overlay */}
          <div
            className={cn(
              "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel Sliding From Left */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Drawer Header */}
            <div className="h-14 border-b border-border px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img
                    src="/logo-kominfotik-mark.png"
                    alt="Logo Sudin Kominfotik"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs tracking-tight text-foreground block truncate">
                    E-Reservasi
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate -mt-0.5">
                    Sudin Kominfotik Jakarta Timur
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase mb-1">
                    {group.title}
                  </div>
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            isActive
                              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                              : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-inherit" : "text-muted-foreground")} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded-full text-[10px] font-semibold shrink-0",
                                isActive
                                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Drawer Bottom Profile */}
            <div className="p-3 border-t border-border/70 bg-muted/20">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/70">
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/pengaturan');
                  }}
                >
                  <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border flex items-center justify-center font-semibold text-xs shrink-0 select-none">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate leading-tight">
                      {currentUser?.fullName || 'Pengguna'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {currentUser?.unitName || 'Pemerintah Kota'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-muted/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY with responsive padding and independent scrolling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* GLOBAL SEARCH DIALOG (Triggered by ⌘K or Header button) */}
      <GlobalSearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
