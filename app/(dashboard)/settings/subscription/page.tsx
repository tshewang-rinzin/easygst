import { redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';
import { getAllPlans, getTeamPlan } from '@/lib/features';
import { getSubscriptionWithPlan, getPaymentHistory } from '@/lib/subscriptions';
import { SubscriptionClient } from './subscription-client';

export default async function SubscriptionPage() {
  const team = await getTeamForUser();
  if (!team) redirect('/sign-in');

  const [allPlans, currentPlan, subscriptionData, payments] = await Promise.all([
    getAllPlans(),
    getTeamPlan(team.id),
    getSubscriptionWithPlan(team.id),
    getPaymentHistory(team.id),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <SubscriptionClient
        team={{ id: team.id, name: team.name }}
        plans={allPlans}
        currentPlan={currentPlan ?? null}
        subscription={subscriptionData?.subscription ?? null}
        payments={payments}
      />
    </section>
  );
}
