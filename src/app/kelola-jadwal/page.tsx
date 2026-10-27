import type { Metadata } from 'next';
import { KelolaJadwalView } from '../../presentation/components/schedule/KelolaJadwalView';

export const metadata: Metadata = {
  title: 'Kelola Jadwal Kegiatan',
};

export default function KelolaJadwalPage() {
  return <KelolaJadwalView />;
}

