import type { Metadata } from 'next';
import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '../presentation/context/AuthContext';
import { ReservationProvider } from '../presentation/context/ReservationContext';
import { ToastProvider } from '../presentation/context/ToastContext';
import { AppLayout } from '../presentation/components/layout/AppLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | E-Reservasi Walikota Jaktim',
    default: 'Dashboard | E-Reservasi Walikota Jaktim',
  },
  description: 'Sistem Informasi Penjadwalan & Reservasi Ruang Rapat Kantor Walikota Administrasi Jakarta Timur',
  icons: {
    icon: [
      { url: '/logo-jaktim.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/logo-jaktim.png',
    shortcut: '/logo-jaktim.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/logo-jaktim.png" />
        <link rel="apple-touch-icon" href="/logo-jaktim.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('e_reservasi_theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="typeset-docs bg-background text-foreground antialiased selection:bg-zinc-900 selection:text-zinc-50">
        <ToastProvider>
          <AuthProvider>
            <ReservationProvider>
              <AppLayout>{children}</AppLayout>
            </ReservationProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
