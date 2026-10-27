# 🏛️ E-Reservasi Ruang Rapat & Jadwal Pimpinan
### Kantor Walikota Kota Administrasi Jakarta Timur
*Sistem Informasi Penjadwalan, Peminjaman Ruang Rapat, dan Sinkronisasi Agenda Pimpinan Kedinasan Terpadu*

Dikembangkan di bawah naungan **Suku Dinas Komunikasi, Informatika, dan Statistik (Sudin Kominfotik) Kota Administrasi Jakarta Timur**.

---

## 🌟 Ringkasan Sistem & Arsitektur Modern

Aplikasi **E-Reservasi Walikota Jakarta Timur** adalah sistem pemerintahan digital berbasis web yang dirancang dengan standar enterprise:
- **Framework:** [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Core Library:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) dengan komponen minimalis [shadcn/ui](https://ui.shadcn.com/)
- **Typography:** `Geist Sans` (Body & Heading) dan `Geist Mono` (Jam, Kode, Angka)
- **Database & Backend:** [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security / RLS, Realtime WebSocket Subscriptions, Functions)
- **Deployment Target:** [Vercel](https://vercel.com/) (Production-Ready)

---

## 🚀 Fitur-Fitur Utama

### 1. Kalender Jadwal Interaktif Gaya Google Calendar (`/kalender`)
- **Tampilan Grid Waktu (07:00 – 20:00 WIB):** Sumbu waktu per jam dengan kolom hari Senin–Minggu (*Week View*), Harian (*Day View*), dan Bulanan (*Month View*).
- **Drag-to-Create & Click-to-Create:** Pengguna dapat mengklik dan menggeser (*drag*) slot jam pada kolom hari untuk langsung memilih rentang waktu rapat secara visual.
- **Modal Reservasi Cepat:** Begitu slot dilepas, popup reservasi bergaya Google Calendar muncul dengan waktu dan tanggal terisi otomatis, dilengkapi pendeteksi bentrok instan.
- **Panel Samping (*Sidebar*):** Dilengkapi kalender mini bulanan (*Datepicker*) dan filter checklist ruangan interaktif (*My Calendars style*).
- **Penanda Status Visual yang Tegas:**
  - **Disetujui Resmi (Acc):** Warna ruangan sejuk (*Blue, Emerald, Violet, Sky, Teal, Cyan*) dengan badge hijau **`✓ Acc`**.
  - **Menunggu Persetujuan Sekpim:** Warna kuning amber lembut bergaris putus-putus (*dashed*) dengan badge **`⏳ Menunggu`**.
  - **Tidak Ada Kebingungan Warna:** Warna kuning/amber secara eksklusif hanya dialokasikan untuk status *Menunggu*.

### 2. Portal Jadwal Pimpinan (View Only untuk Seluruh OPD) (`/jadwal-pimpinan`)
- **Transparansi Agenda Kedinasan:** Khusus bagi seluruh Bagian / Suku Dinas / OPD untuk memantau kapan Walikota, Wakil Walikota, Sekretaris Kota, dan para Asisten memiliki agenda rapat atau audiensi.
- **Filter Pimpinan Instan:** Tab cepat untuk *Semua Pimpinan*, *Walikota*, *Wakil Walikota*, *Sekko*, *Aspem*, *Asekbang*, dan *Askesra*.
- **Filter Waktu & Status:** Mendukung filter *Semua*, *Mendatang*, *Hari Ini*, *Minggu Ini*, serta status *Disetujui* dan *Menunggu*.
- **Sinkronisasi Otomatis:** Setiap agenda pimpinan yang baru diajukan langsung tampil di portal ini secara real-time.

### 3. Formulir Pengajuan & Validasi Anti Bentrok (`/reservasi/baru`)
- **Algoritma Deteksi Bentrok Real-Time (`ConflictDetector`):** Mengecek irisan waktu pada tanggal dan ruangan yang sama saat pengguna memilih jam mulai dan jam selesai.
- **Peringatan Bentrok Interaktif:** Menampilkan peringatan dini jika ruangan sudah terisi, mencantumkan nama acara pemohon sebelumnya beserta jamnya.
- **Formulir Terstandar Protokoler:** Input Pejabat Pelaksana, Pejabat Pendamping, Pakaian (*Dress Code*), Asal Surat/Bagian, dan Ruangan.

### 4. Meja Verifikasi Sekretariat Pimpinan (Sekpim) (`/verifikasi`)
- **Otorisasi Berjenjang (RBAC):** Khusus untuk Verifikator Asisten (Aspem), Verifikator Pimpinan (Walikota/Sekko), dan Admin.
- **Penyematan Label Kategori:** Verifikator dapat menyematkan kategori resmi (*Rapat Koordinasi Wilayah, Audiensi Pimpinan, Evaluasi Kinerja, Sosialisasi Regulasi*, dll.).
- **Catatan & Alasan Penolakan:** Menolak permohonan dengan menyertakan alasan tertulis yang langsung terkirim ke riwayat pemohon.
- **Pembatasan Hak Edit Sesuai PRD:** Verifikator Asisten dibatasi hanya dapat mengubah kolom Pejabat Pelaksana dan Pendamping, sedangkan Pimpinan memiliki otorisasi perubahan penuh.

### 5. Riwayat Pengajuan & Koordinasi PIC WhatsApp (`/reservasi/riwayat`)
- **Pelacakan Status Permohonan:** Memantau apakah reservasi berstatus *Menunggu*, *Disetujui*, atau *Ditolak*.
- **Filter Tab Riwayat:** Pilihan tampilan *Pengajuan Saya* atau *Semua Instansi*, lengkap dengan kolom pencarian cepat.
- **Pembatalan Mandiri:** Pemohon dapat membatalkan pengajuan yang masih berstatus *Menunggu*.
- **Protokoler Perubahan via WhatsApp PIC:** Sesuai SOP kedinasan, jadwal yang telah disetujui tidak dapat diubah sepihak, melainkan melalui koordinasi langsung via tombol WhatsApp ke PIC Bidang terkait (Pemerintahan, Kesra, atau Ekbang).

### 6. Manajemen Ruangan & Mode Pemeliharaan (`/ruangan`)
- **Katalog Ruangan Lengkap:** Foto, denah lantai, kapasitas orang, dan daftar fasilitas (Videotron, Sound System, Mic Wireless, AC Central, Podium).
- **Tombol Aktif / Nonaktif Pemeliharaan:** Ruangan yang sedang direnovasi atau disterilkan dapat dinonaktifkan sementara dari pilihan booking (hanya dapat diubah oleh Aspem, Walikota, dan Admin).

### 7. Laporan & Rekapitulasi SPJ (`/laporan`)
- **Filter Fleksibel:** Filter berdasarkan ruangan, rentang tanggal, dan status verifikasi.
- **Ekspor Excel (.xlsx):** Format tabel siap olah untuk keperluan administrasi dan SPJ.
- **Ekspor PDF Resmi (.pdf):** Format dokumen cetak resmi dengan tata letak kop kedinasan Pemerintah Kota Administrasi Jakarta Timur.

### 8. Keamanan & Sistem Otentikasi (Single Page Login & Middleware)
- **Single Page Unified Login (`/login`):** Satu formulir terpadu yang melayani seluruh peran pengguna tanpa tombol coba-coba instan.
- **Validasi Sandi Ketat:** Mencegah login dengan sandi sembarangan.
- **Next.js Edge Middleware (`middleware.ts`):**
  - Mencegah akses masuk langsung via URL tanpa login yang sah.
  - Membatasi hak akses halaman tertentu (misalnya `/verifikasi` hanya untuk asisten/pimpinan/admin, dan `/pengaturan/users` hanya untuk admin).
- **Branding Transparan:** Logo Sudin Kominfotik dan Lambang Jakarta Timur telah ditransparansikan secara profesional sehingga menyatu bersih baik di mode terang maupun mode gelap.

### 9. Fitur Penunjang Unggulan
- **Global Search Shortcut (`⌘K` / `Ctrl+K`):** Akses cepat ke halaman, ruangan, dan agenda dari mana saja.
- **Mode Gelap / Terang (Dark / Light Mode):** Tersimpan di *localStorage*, menyesuaikan preferensi pengguna.
- **Notifikasi Terpadu:** Dropdown notifikasi responsif (bebas blur di desktop, tidak terpotong di layar HP).

---

## 🏗️ Struktur Arsitektur (Clean & Layered Architecture)

```
src/
├── domain/                      # Lapisan Inti Bisnis (Enterprise Business Rules)
│   ├── entities/                # Model murni: Room, Reservation, UserProfile, Category, PicContact
│   └── repositories/            # Kontrak Interface (IRoomRepository, IReservationRepository, dll)
│
├── application/                 # Lapisan Kasus Penggunaan (Use Cases & Business Logic)
│   └── validation/
│       └── ConflictDetector.ts  # Algoritma validasi irisan waktu anti double-booking
│
├── infrastructure/              # Lapisan Driver & Adaptor Eksternal
│   ├── supabase/                # Client Supabase Browser & SSR
│   ├── repositories/            # Dual Implementation:
│   │   ├── SupabaseRoomRepository.ts
│   │   ├── SupabaseReservationRepository.ts
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseNotificationRepository.ts
│   │   ├── MockRoomRepository.ts (Offline Fallback)
│   │   ├── MockReservationRepository.ts
│   │   └── index.ts             # Repository Factory (Switch otomatis Supabase ↔ Mock)
│   └── mock-data/               # Data awal realistis Kantor Walikota Jaktim
│
├── presentation/                # Lapisan UI & State Management (React 19, Tailwind & shadcn/ui)
│   ├── components/
│   │   ├── layout/              # Sidebar Collapsible, Breadcrumbs, Navbar, Brand Logo
│   │   ├── calendar/            # Google Calendar drag-to-create & time grid
│   │   ├── pimpinan/            # Portal Jadwal Pimpinan View-Only
│   │   ├── reservation/         # Form pengajuan & riwayat
│   │   ├── approval/            # Meja verifikasi Sekpim
│   │   ├── room/                # Katalog ruangan & toggle status pemeliharaan
│   │   ├── report/              # Rekapitulasi & ekspor laporan (.xlsx & .pdf)
│   │   ├── search/              # Global Search Dialog (⌘K)
│   │   ├── user/                # Manajemen pengguna
│   │   └── ui/                  # Primitif shadcn/ui (Button, Card, Badge, Dialog, Toast, dll)
│   └── context/                 # AuthContext, ReservationContext, ToastContext
│
├── middleware.ts                # Next.js Middleware untuk proteksi hak akses dan rute
└── app/                         # Next.js 16 App Router (16 rute statis & dinamis)
```

---

## 🔐 Akun & Kredensial Resmi Uji Coba

Gunakan akun resmi berikut pada halaman [Login (`/login`)](http://localhost:3000/login):

| No | Peran / Role | Nama Pejabat / Pengguna | Email Kedinasan | Kata Sandi | Hak Akses Utama |
|---|---|---|---|---|---|
| 1 | **User Bagian (OPD)** | Budi Setiawan | `budi@jakarta.go.id` | `walikota2026` | Pengajuan reservasi, batal pengajuan, cek riwayat, cek jadwal pimpinan |
| 2 | **Verifikator Asisten** | Drs. H. Ahmad Fauzi, M.Si (Aspem) | `aspem@jakarta.go.id` | `walikota2026` | Meja verifikasi Sekpim, sematkan kategori, tolak acara, toggle ruangan |
| 3 | **Verifikator Pimpinan** | M. Anwar, S.Si, M.AP (Walikota) | `walikota@jakarta.go.id` | `walikota2026` | Otorisasi penuh Sekpim, ubah disposisi ruangan, toggle ruangan |
| 4 | **Admin Kominfotik** | Siti Rahmawati, S.Kom | `admin.kominfotik@jakarta.go.id` | `walikota2026` | Manajemen user & role, manajemen master ruangan, laporan & audit |

*Alias email alternatif yang juga terdaftar: `pemerintahan@jakarta.go.id`, `asisten@jakarta.go.id`, `walikota@jakarta.go.id`.*

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- **Node.js:** Versi 18.18 atau lebih baru (direkomendasikan Node.js 20+)
- **NPM:** Versi 9+

### 2. Kloning & Pemasangan Dependensi
```bash
# Masuk ke folder proyek
cd revervation-walikota

# Pasang seluruh dependensi proyek
npm install
```

### 3. Konfigurasi Environment (`.env.local`)
Buat file bernama `.env.local` di root folder proyek, lalu isi dengan konfigurasi Supabase berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://NEXT_PUBLIC_SUPABASE_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NEXT_PUBLIC_SUPABASE_ANON_KEY
```

> **💡 Graceful Fallback:** Jika koneksi Supabase offline atau belum diisi, Repository Factory secara otomatis beralih ke **Persistent LocalStorage Mock**, sehingga seluruh fitur tetap berjalan normal tanpa kendala.

### 4. Menjalankan Aplikasi dalam Mode Pengembangan
```bash
npm run dev
```
Buka browser di: **`http://localhost:3000`**

### 5. Verifikasi Build Produksi
```bash
npm run build
```
Seluruh 16 rute akan dikompilasi secara statis dan teroptimasi.

---

## 🌐 Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi dan diverifikasi siap dideploy langsung ke [Vercel](https://vercel.com/):

### Opsi A: Melalui GitHub & Dashboard Vercel (Rekomendasi)
1. **Push Proyek ke Repository GitHub Anda:**
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/e-reservasi-walikota.git
   git branch -M main
   git push -u origin main
   ```
2. **Import ke Vercel:**
   - Kunjungi [vercel.com/new](https://vercel.com/new).
   - Pilih repository GitHub `e-reservasi-walikota`.
   - Pada bagian **Environment Variables**, tambahkan:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-public-key-here`
   - Klik **Deploy**. Aplikasi akan otomatis aktif dan siap digunakan dalam ~1 menit!

### Opsi B: Deploy Cepat via Terminal (Vercel CLI)
```bash
# Jalankan Vercel CLI
npx vercel

# Tambahkan Environment Variables
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy ke Production Live
npx vercel --prod
```

---

## 📁 Daftar Rute Halaman (Next.js App Router)

| Rute URL | Nama Halaman | Akses Peran | Deskripsi |
|---|---|---|---|
| `/login` | Masuk Akun Kedinasan | Publik | Formulir login tunggal dengan validasi sandi |
| `/dashboard` | Dashboard Utama | Semua Role | Statistik pemanfaatan ruangan, jadwal hari ini, & grafik |
| `/kalender` | Kalender Jadwal Interaktif | Semua Role | Tampilan grid Google Calendar, drag slot jam, reservasi cepat |
| `/jadwal-pimpinan` | Jadwal Pimpinan (View Only) | Semua Role | Portal pantau jadwal Walikota, Wawali, Sekko, & Asisten |
| `/reservasi/baru` | Formulir Reservasi Baru | User Bagian, Admin | Pengajuan ruangan dengan deteksi bentrok real-time |
| `/reservasi/riwayat` | Riwayat Pengajuan | Semua Role | Pantau status pengajuan, batal reservasi, kontak WA PIC |
| `/verifikasi` | Meja Verifikasi Sekpim | Asisten, Pimpinan, Admin | Setujui dengan kategori, tolak berargumen, edit data |
| `/ruangan` | Data & Manajemen Ruangan | Semua Role | Katalog ruangan, fasilitas, dan toggle pemeliharaan |
| `/laporan` | Laporan & Rekapitulasi | Semua Role | Rekapitulasi dan ekspor data ke Excel (.xlsx) dan PDF |
| `/pengaturan` | Pengaturan Akun | Semua Role | Profil pengguna, ubah informasi, dan preferensi tema |
| `/pengaturan/users` | Kelola Pengguna | Khusus Admin | Tambah, edit, aktifkan/nonaktifkan akun dan peran dinas |

---

## 🏛️ Hak Cipta & Pengembang

Dikembangkan untuk kebutuhan kedinasan resmi:
**Pemerintah Kota Administrasi Jakarta Timur**  
Jl. Sentra Primer Timur, Pulo Gebang, Kec. Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13950.
