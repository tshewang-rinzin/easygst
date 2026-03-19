import { getUser, getTeamForUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser();
  if (team?.onboardingCompleted) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-amber-800">EasyGST</span>
        </div>
        <p className="text-sm text-gray-500">Set up your business in minutes</p>
      </div>
      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
