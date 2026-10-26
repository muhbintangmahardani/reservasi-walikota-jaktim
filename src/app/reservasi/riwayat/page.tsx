import type { Metadata } from 'next';
import { ReservationHistory } from '../../../presentation/components/reservation/ReservationHistory';

export const metadata: Metadata = {
  title: 'Riwayat Pengajuan',
};

export default function RiwayatReservasiPage() {
  return <ReservationHistory />;
}

