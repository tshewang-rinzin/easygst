import { getUser, getTeamForUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser();
  if (team && !team.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <DashboardClient>{children}</DashboardClient>;
}
