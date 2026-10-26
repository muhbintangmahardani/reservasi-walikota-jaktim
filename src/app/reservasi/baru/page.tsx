import type { Metadata } from 'next';
import { ReservationForm } from '../../../presentation/components/reservation/ReservationForm';

export const metadata: Metadata = {
  title: 'Formulir Reservasi Baru',
};

export default function BaruReservasiPage() {
  return <ReservationForm />;
}

