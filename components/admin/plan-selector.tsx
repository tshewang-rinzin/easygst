'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PlanSelectorProps {
  teamId: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
}

export function PlanSelector({ teamId, currentPlanId, currentPlanName }: PlanSelectorProps) {
  const [saving, setSaving] = useState(false);
  const { data: plans } = useSWR('/api/admin/plans', fetcher);

  const handleChange = async (planId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planId === 'none' ? null : planId }),
      });
      if (!res.ok) throw new Error('Failed to update plan');
      // Revalidate - force page refresh
      window.location.reload();
    } catch (e) {
      console.error('Failed to update plan:', e);
    } finally {
      setSaving(false);
    }
  };

  if (!plans) {
    return (
      <Badge className="bg-gray-100 text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Loading...
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {saving && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
      <Select
        defaultValue={currentPlanId || 'none'}
        onValueChange={handleChange}
        disabled={saving}
      >
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder="Select plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-gray-400">No plan</span>
          </SelectItem>
          {plans.map((plan: any) => (
            <SelectItem key={plan.id} value={plan.id}>
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-orange-500" />
                {plan.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
