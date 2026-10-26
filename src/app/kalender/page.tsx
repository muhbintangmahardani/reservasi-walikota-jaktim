import type { Metadata } from 'next';
import { ScheduleCalendar } from '../../presentation/components/calendar/ScheduleCalendar';

export const metadata: Metadata = {
  title: 'Kalender Jadwal',
};

export default function KalenderPage() {
  return <ScheduleCalendar />;
}

