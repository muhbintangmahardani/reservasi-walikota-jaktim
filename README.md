# 🏛️ E-Reservasi Ruang Rapat & Fasilitas Kantor Walikota Jakarta Timur

Aplikasi web modern berbasis **Next.js 14 (App Router, TypeScript, Tailwind CSS, shadcn/ui)** dengan **Clean & Layered Architecture** yang terintegrasi penuh ke backend **Supabase (PostgreSQL 15, Row Level Security / RLS, Realtime Subscriptions, Database Functions)**.

---

## 🏗️ Arsitektur Sistem (Clean & Layered Architecture)

Aplikasi dirancang mengikuti standar Clean Architecture (Domain-Driven Design) sehingga seluruh aturan bisnis kedinasan terisolasi secara murni dari framework UI maupun vendor database:

```
src/
├── domain/                      # Lapisan Inti Bisnis (Enterprise Business Rules)
│   ├── entities/                # Model murni: Room, Reservation, UserProfile, Category, PicContact
│   └── repositories/            # Kontrak Interface (IRoomRepository, IReservationRepository, IUserRepository, dll)
│
├── application/                 # Lapisan Kasus Penggunaan (Use Cases & Business Logic)
│   └── validation/
│       └── ConflictDetector.ts  # Algoritma pendeteksi irisan waktu anti double-booking
│
├── infrastructure/              # Lapisan Driver & Adaptor Eksternal
│   ├── supabase/                # Client Supabase Browser & SSR serta deteksi konfigurasi env
│   ├── repositories/            # Dual Implementation:
│   │   ├── SupabaseRoomRepository.ts
│   │   ├── SupabaseReservationRepository.ts
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseNotificationRepository.ts
│   │   ├── MockRoomRepository.ts (Persistent LocalStorage Fallback)
│   │   ├── MockReservationRepository.ts
│   │   └── index.ts             # Repository Factory (Switch otomatis Supabase ↔ Mock)
│   └── mock-data/               # Data awal realistis Kantor Walikota Jaktim
│
├── presentation/                # Lapisan UI & State Management (React, Tailwind & shadcn/ui)
│   ├── components/
│   │   ├── layout/              # Sidebar Collapsible (256px ↔ 68px), Breadcrumbs, Role Switcher, Status Pill
│   │   ├── calendar/            # Google Calendar-style blocking grid (07:00-18:00), Date Indicator (Putih/Kuning/Merah)
│   │   ├── reservation/         # Form pengajuan dengan deteksi konflik realtime & riwayat pembatalan
│   │   ├── approval/            # Meja verifikasi Sekpim (Asisten & Pimpinan) dengan pembatasan hak edit
│   │   ├── room/                # Katalog ruangan & fasilitas (Aktif/Nonaktif)
│   │   ├── report/              # Rekapitulasi & ekspor laporan (.xlsx & .pdf)
│   │   ├── user/                # Manajemen akun & role oleh Admin Kominfotik
│   │   └── ui/                  # Primitif shadcn/ui (Button, Card, Badge, Dialog, Table, Input, Breadcrumb)
│   └── context/                 # AuthContext & ReservationContext dengan Supabase Realtime
│
└── app/                         # Next.js 14 App Router (15 rute statis & dinamis)
```

---

## ⚡ Setup Backend Supabase (Langkah Cepat)

Backend database telah disiapkan dalam bentuk file SQL migration dan seed data yang siap dieksekusi di Supabase Cloud:

### 1. Buat Proyek di Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan klik **New Project**.
2. Beri nama proyek, misalnya: `walikota-jaktim-reservasi`.
3. Simpan kata sandi database Anda.

### 2. Jalankan Skema Migrasi (Migration)
1. Buka menu **SQL Editor** pada sidebar kiri dashboard Supabase Anda.
2. Buka file `supabase/migrations/001_initial_schema.sql` di proyek ini, lalu salin (*copy*) seluruh isinya.
3. Tempel (*paste*) ke dalam SQL Editor Supabase, lalu klik tombol **Run**.
4. Skema akan membuat:
   - ENUM types: `user_role_enum`, `user_type_enum`, `reservation_status_enum`, `notif_type_enum`.
   - Tabel: `profiles`, `rooms`, `categories`, `pic_contacts`, `reservations`, `notifications`, `audit_logs`.
   - Function PostgreSQL: `check_reservation_conflict()` untuk validasi bentrok irisan jam di sisi database.
   - Row Level Security (RLS) policies.
   - Realtime publication pada tabel `reservations`, `notifications`, `rooms`, dan `categories`.

### 3. Masukkan Data Awal (Seed Data)
1. Buka kembali **SQL Editor** di Supabase.
2. Salin isi file `supabase/seed.sql`.
3. Tempel dan klik **Run**.
4. Database akan terisi dengan:
   - 8 Ruang Rapat resmi Kantor Walikota Jakarta Timur (Ruang Pola, Ruang Walikota, Ruang Wakil Walikota, Ruang Sekko, Aspem, Ekbang, Kesra, Auditorium).
   - 6 Kategori Agenda pimpinan.
   - 3 Kontak WhatsApp PIC Bidang (Pemerintahan, Kesra, Ekbang).
   - 4 Akun pengguna demo sesuai peran PRD.
   - Contoh reservasi aktif (disetujui, menunggu verifikasi, ditolak).

### 4. Hubungkan ke Next.js (.env.local)
1. Di dashboard Supabase, buka menu **Project Settings** -> **API**.
2. Salin **Project URL** dan **anon public key**.
3. Buat atau perbarui file `.env.local` pada folder proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Simpan file, lalu jalankan aplikasi:
   ```bash
   npm run dev
   ```
5. Perhatikan indikator di navbar atas: pill status akan langsung menyala hijau: `Supabase Live`.

> **💡 Catatan Fleksibilitas (Graceful Fallback):**
> Jika kunci `.env.local` belum diisi atau masih menggunakan placeholder, aplikasi tidak akan crash atau error. Repository Factory secara otomatis menggunakan **Local Mock Storage**, sehingga Anda tetap bisa mendemokan seluruh alur sistem secara offline.

---

## 🔄 Fitur Realtime Subscriptions
Ketika backend Supabase aktif, `ReservationContext` secara otomatis membuka channel WebSocket ke Supabase Realtime:
- Ketika pengguna mengajukan reservasi baru di satu browser, daftar pengajuan di meja verifikasi Asisten/Pimpinan langsung bertambah tanpa perlu refresh.
- Ketika verifikator menyetujui atau menolak reservasi, status di kalender dan riwayat pemohon langsung ter-update secara instan.

---

## 👥 Pengujian Alur Sesuai PRD (Role Simulator)

Gunakan dropdown **Peran** di navbar kanan atas untuk menguji berbagai skenario kedinasan:
1. **User Bagian (Budi Setiawan):**
   - Mengajukan reservasi ruangan baru.
   - Membatalkan reservasi berstatus *menunggu*.
   - Jika status telah *disetujui*, tombol edit terkunci dan otomatis menampilkan kontak WhatsApp resmi PIC bidang terkait (Pemerintahan, Kesra, atau Ekbang).
2. **Verifikator Sekpim Asisten (Drs. H. Ahmad Fauzi):**
   - Menyetujui pengajuan dengan menyematkan **Label Kategori Agenda**.
   - Menolak pengajuan dengan mengisi formulir modal alasan penolakan.
   - Sesuai PRD: Hak penyuntingan dibatasi **hanya kolom Pejabat Pelaksana dan Pendamping**.
3. **Verifikator Sekpim Pimpinan (M. Anwar, S.Si, M.AP):**
   - Memiliki otorisasi penuh untuk mengedit seluruh field agenda pimpinan dan disposisi ruangan.
4. **Admin Kominfotik (Siti Rahmawati, S.Kom):**
   - Manajemen master ruangan (tambah, edit, aktifkan/nonaktifkan ruangan dalam pemeliharaan).
   - Manajemen pengguna (tambah, edit hak akses internal/eksternal, reset sandi).

---

## 📱 Desain & Tipografi
- **UI Framework:** Tailwind CSS dengan komponen shadcn/ui bergaya minimalis dan elegan.
- **Typeset Typography:**
  - Body & Heading: `Geist Sans`
  - Kode, badge, jam/waktu, angka kalender: `Geist Mono`
- **Sidebar:** Collapsible (256px mode luas dan 68px mode ringkas) dengan breadcrumb navigasi.
- **Responsif:** Desktop, iPad / Tablet, dan Mobile.
