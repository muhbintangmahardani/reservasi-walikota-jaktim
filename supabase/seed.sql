-- ==============================================================================
-- SEED DATA: SISTEM E-RESERVASI WALIKOTA JAKARTA TIMUR
-- Jalankan di SQL Editor Supabase setelah menjalankan 001_initial_schema.sql
-- ==============================================================================

-- 1. Seed Master Ruangan (Rooms)
insert into public.rooms (id, name, building_floor, capacity, facilities, is_active, image_url, description)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Ruang Pola Lantai 2 Blok A',
    'Gedung Blok A, Lantai 2',
    150,
    array['Videotron LED Screen', 'Sound System Deluxe', 'Mic Wireless (10)', 'AC Central', 'Podium', 'Live Streaming Kit'],
    true,
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    'Ruangan utama untuk rapat koordinasi akbar, sidang paripurna tingkat kota, dan sosialisasi program strategis Walikota.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Ruang Rapat Walikota',
    'Gedung Blok A, Lantai 2',
    35,
    array['Smart TV 85 Inch', 'Meja Bundar Oval', 'Audio Conference', 'AC Central', 'Mic Delegate (20)'],
    true,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'Ruang rapat VIP terbatas khusus pengarahan langsung oleh Walikota dan tamu kehormatan.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Ruang Rapat Wakil Walikota',
    'Gedung Blok A, Lantai 2',
    25,
    array['Smart TV 75 Inch', 'Video Conference PTZ Camera', 'AC Split', 'Mic Delegate (12)'],
    true,
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    'Ruang rapat untuk koordinasi program kerja pengawasan dan disposisi Wakil Walikota.'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Ruang Rapat Sekretaris Kota (Sekko)',
    'Gedung Blok A, Lantai 3',
    40,
    array['Proyektor Laser HD', 'Layar Motorized', 'Sound System', 'AC Central', 'Mic Delegate (16)'],
    true,
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
    'Ruang pertemuan administrasi kedinasan, evaluasi serapan anggaran, dan koordinasi internal perangkat daerah.'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Ruang Rapat Asisten Pemerintahan (Aspem)',
    'Gedung Blok A, Lantai 3',
    30,
    array['Smart TV 65 Inch', 'Whiteboard Glass', 'AC Split', 'Mic Wireless (4)'],
    true,
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    'Ruang koordinasi bidang pemerintahan, ketertiban umum, hukum, dan kependudukan.'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Ruang Rapat Asisten Ekbang',
    'Gedung Blok A, Lantai 4',
    30,
    array['Proyektor Full HD', 'Sound System', 'AC Split', 'Mic Wireless (4)'],
    true,
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    'Ruang koordinasi perekonomian, tata ruang, pembangunan fisik, dan lingkungan hidup.'
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'Ruang Rapat Asisten Kesra',
    'Gedung Blok A, Lantai 4',
    30,
    array['Smart TV 65 Inch', 'AC Split', 'Mic Delegate (10)'],
    true,
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    'Ruang koordinasi bidang pendidikan, kesehatan, sosial, keagamaan, dan pemberdayaan masyarakat.'
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Auditorium Serbaguna Blok B',
    'Gedung Blok B, Lantai Dasar',
    250,
    array['Panggung Utama', 'Sound System Line Array', 'Lighting System', 'Layar Lebar Dual Proyektor', 'AC Standing (6)'],
    false,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    'Sedang dalam pemeliharaan berkala sistem tata suara dan pendingin ruangan.'
  )
on conflict (id) do nothing;

-- 2. Seed Kategori Agenda (Categories)
insert into public.categories (id, name, color_code, description)
values
  ('10000000-0000-0000-0000-000000000001', 'Rakor Pimpinan Tingkat Kota', '#1e40af', 'Rapat pimpinan Walikota, Wakil Walikota, dan Sekko'),
  ('10000000-0000-0000-0000-000000000002', 'Evaluasi Kinerja & Serapan Anggaran', '#b45309', 'Monitoring program dan evaluasi UKPD'),
  ('10000000-0000-0000-0000-000000000003', 'Sosialisasi & Workshop Teknis', '#047857', 'Pelatihan teknis aparatur atau bimtek'),
  ('10000000-0000-0000-0000-000000000004', 'Audiensi Publik & Komunitas', '#6d28d9', 'Penerimaan aspirasi masyarakat dan ormas'),
  ('10000000-0000-0000-0000-000000000005', 'Protokoler & Kedinasan Khusus', '#be123c', 'Kunjungan kerja Kementerian / Gubernur'),
  ('10000000-0000-0000-0000-000000000006', 'Rapat Koordinasi Wilayah', '#0e7490', 'Koordinasi Camat dan Lurah')
on conflict (id) do nothing;

-- 3. Seed Kontak PIC Bidang (PIC Contacts)
insert into public.pic_contacts (id, sector_name, pic_name, whatsapp_number, email, is_active)
values
  ('20000000-0000-0000-0000-000000000001', 'Pemerintahan', 'Ibu Hendriani (Subbag Tata Pemerintahan)', '6281298765432', 'subbag.pem.jaktim@jakarta.go.id', true),
  ('20000000-0000-0000-0000-000000000002', 'Kesejahteraan Rakyat (Kesra)', 'Bpk. Rizky Ramadhan (Subbag Kesra)', '6281312345678', 'subbag.kesra.jaktim@jakarta.go.id', true),
  ('20000000-0000-0000-0000-000000000003', 'Perekonomian & Pembangunan (Ekbang)', 'Ibu Dian Safitri (Subbag Perekonomian)', '6281987654321', 'subbag.ekbang.jaktim@jakarta.go.id', true)
on conflict (id) do nothing;

-- 4. Seed Data Profil Pengguna (Profiles)
insert into public.profiles (id, full_name, unit_name, role, user_type, email, phone_number, is_active)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Budi Setiawan',
    'Bagian Pemerintahan',
    'user_bagian',
    'internal',
    'budi@jakarta.go.id',
    '081234567890',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Drs. H. Ahmad Fauzi, M.Si',
    'Asisten Pemerintahan (Aspem)',
    'verifikator_asisten',
    'internal',
    'aspem@jakarta.go.id',
    '081398765432',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'M. Anwar, S.Si, M.AP',
    'Walikota Kota Administrasi Jakarta Timur',
    'verifikator_pimpinan',
    'internal',
    'walikota@jakarta.go.id',
    '081122334455',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Siti Rahmawati, S.Kom',
    'Suku Dinas Kominfotik Jakarta Timur',
    'admin',
    'internal',
    'admin.kominfotik@jakarta.go.id',
    '081987654321',
    true
  )
on conflict (id) do nothing;

-- 5. Seed Reservasi Contoh (Reservations)
insert into public.reservations (
  id,
  user_id,
  room_id,
  custom_room_name,
  event_name,
  event_date,
  start_time,
  end_time,
  executor_official,
  accompanying_official,
  dress_code,
  letter_origin,
  category_id,
  status,
  rejection_reason,
  verified_by,
  verified_at
)
values
  -- Reservasi 1: Disetujui Hari Ini di Ruang Pola
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Rapat Koordinasi Penataan Kota & Pengendalian Banjir Jakarta Timur',
    current_date,
    '08:30:00',
    '11:30:00',
    'Walikota Kota Administrasi Jakarta Timur',
    'Aspem, Asisten Ekbang, Kasudin SDA',
    'Pakaian Dinas Harian (PDH)',
    'Bagian Pemerintahan',
    '10000000-0000-0000-0000-000000000001',
    'disetujui',
    null,
    '30000000-0000-0000-0000-000000000002',
    now() - interval '1 day'
  ),

  -- Reservasi 2: Disetujui Hari Ini di Ruang Rapat Walikota
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    null,
    'Audiensi Dewan Pengurus PMI Jakarta Timur terkait Program Bulan Dana',
    current_date,
    '13:30:00',
    '15:00:00',
    'Walikota Kota Administrasi Jakarta Timur',
    'Asisten Kesra & Kabag Kesra',
    'Batik Lengan Panjang / Tenun',
    'Bagian Kesejehteraan Rakyat (Kesra)',
    '10000000-0000-0000-0000-000000000004',
    'disetujui',
    null,
    '30000000-0000-0000-0000-000000000003',
    now() - interval '2 days'
  ),

  -- Reservasi 3: Disetujui Besok di Ruang Rapat Sekko
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    null,
    'Rapat Evaluasi Serapan Realisasi Anggaran Triwulan Bersama Seluruh Camat',
    current_date + interval '1 day',
    '09:00:00',
    '12:00:00',
    'Sekretaris Kota (Sekko)',
    'Seluruh Kepala Bagian & Camat se-Jaktim',
    'Pakaian Dinas Harian (PDH)',
    'Bagian Program, Pelaporan, dan Keuangan (PPK)',
    '10000000-0000-0000-0000-000000000002',
    'disetujui',
    null,
    '30000000-0000-0000-0000-000000000002',
    now() - interval '3 hours'
  ),

  -- Reservasi 4: Menunggu Verifikasi (Pending untuk dites di Meja Verifikasi)
  (
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005',
    null,
    'Bimbingan Teknis Penyusunan Standar Operasional Prosedur (SOP) Pelayanan Terpadu',
    current_date + interval '2 days',
    '10:00:00',
    '12:30:00',
    'Asisten Pemerintahan (Aspem)',
    'Kabag KKPP & Tim Analis Kepegawaian',
    'Pakaian Dinas Harian (PDH)',
    'Bagian Kepegawaian, Ketatalaksanaan, dan Pelayanan Publik (KKPP)',
    null,
    'menunggu',
    null,
    null,
    null
  ),

  -- Reservasi 5: Menunggu Verifikasi (Pending 2)
  (
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    null,
    'Sosialisasi Ketahanan Pangan & Pasar Murah Digital Jelang Ramadhan',
    current_date + interval '3 days',
    '13:00:00',
    '15:30:00',
    'Asisten Perekonomian dan Pembangunan',
    'Kabag Perekonomian, Kasudin KPKP',
    'Batik Lengan Panjang / Tenun',
    'Bagian Perekonomian',
    null,
    'menunggu',
    null,
    null,
    null
  ),

  -- Reservasi 6: Ditolak (Dengan Alasan Penolakan)
  (
    '40000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    null,
    'Diskusi Internal Komunitas Kreatif Pemuda',
    current_date - interval '2 days',
    '14:00:00',
    '16:00:00',
    'Asisten Kesra',
    'Staf Subbag Pemuda',
    'Bebas Rapi Berkerah',
    'Bagian Kesejehteraan Rakyat (Kesra)',
    null,
    'ditolak',
    'Ruang Rapat Walikota diprioritaskan untuk rapat kedinasan pimpinan. Disarankan dialihkan ke Ruang Rapat Asisten Lantai 4.',
    '30000000-0000-0000-0000-000000000002',
    now() - interval '2 days'
  )
on conflict (id) do nothing;

-- 6. Seed Notifikasi Contoh (Notifications)
insert into public.notifications (id, recipient_id, reservation_id, title, message, type, is_read)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Reservasi Disetujui!',
    'Pengajuan Ruang Pola Lantai 2 Blok A untuk "Rapat Koordinasi Penataan Kota" telah disetujui.',
    'success',
    false
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000004',
    'Pengajuan Reservasi Berhasil',
    'Pengajuan ruangan Bimtek SOP sedang menunggu verifikasi Sekpim (Asisten/Pimpinan).',
    'info',
    true
  )
on conflict (id) do nothing;

