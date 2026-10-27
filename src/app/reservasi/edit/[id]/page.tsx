import type { Metadata } from 'next';
import { EditSchedulePageView } from '../../../../presentation/components/schedule/EditSchedulePageView';

export const metadata: Metadata = {
  title: 'Kelola & Edit Jadwal',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSchedulePage({ params }: PageProps) {
  const { id } = await params;
  return <EditSchedulePageView id={id} />;
}
