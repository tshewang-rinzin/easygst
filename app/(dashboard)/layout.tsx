import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  return <DashboardClient>{children}</DashboardClient>;
}
