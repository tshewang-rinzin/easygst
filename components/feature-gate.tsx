'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client component that checks if a feature is enabled for the current team.
 * Wraps content and shows a locked message if the feature is disabled.
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/features/check?code=${feature}`)
      .then(r => r.json())
      .then(data => setEnabled(data.enabled))
      .catch(() => setEnabled(true)); // Fail open
  }, [feature]);

  if (enabled === null) return null; // Loading
  if (enabled) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <Card className="border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="h-10 w-10 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-1">Feature Not Available</h3>
        <p className="text-sm text-gray-500 max-w-md">
          This feature is not included in your current plan. Contact your administrator to upgrade.
        </p>
      </CardContent>
    </Card>
  );
}
