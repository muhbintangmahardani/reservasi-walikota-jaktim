import type { Metadata } from 'next';
import { DashboardOverview } from '../../presentation/components/dashboard/DashboardOverview';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardOverview />;
}

