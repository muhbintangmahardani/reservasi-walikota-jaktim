import type { Metadata } from 'next';
import { UserManagement } from '../../../presentation/components/user/UserManagement';

export const metadata: Metadata = {
  title: 'Manajemen Pengguna',
};

export default function UsersSettingsPage() {
  return <UserManagement />;
}

