import type { Metadata } from 'next';
import { RoomManagement } from '../../presentation/components/room/RoomManagement';

export const metadata: Metadata = {
  title: 'Data Ruang Rapat',
};

export default function RuanganPage() {
  return <RoomManagement />;
}

