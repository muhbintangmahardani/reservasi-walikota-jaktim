import type { Metadata } from 'next';
import { ReportDashboard } from '../../presentation/components/report/ReportDashboard';

export const metadata: Metadata = {
  title: 'Laporan & Rekapitulasi',
};

export default function LaporanPage() {
  return <ReportDashboard />;
}

