import type { Metadata } from 'next';
import { ApprovalDashboard } from '../../presentation/components/approval/ApprovalDashboard';

export const metadata: Metadata = {
  title: 'Meja Verifikasi Sekpim',
};

export default function VerifikasiPage() {
  return <ApprovalDashboard />;
}

