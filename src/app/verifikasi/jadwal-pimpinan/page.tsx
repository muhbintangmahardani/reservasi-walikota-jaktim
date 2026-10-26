import type { Metadata } from 'next';
import { JadwalPimpinanView } from '../../../presentation/components/pimpinan/JadwalPimpinanView';

export const metadata: Metadata = {
  title: 'Jadwal Pimpinan',
};

export default function JadwalPimpinanPage() {
  return <JadwalPimpinanView />;
}

