import { hasFeature } from '@/lib/features';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface FeaturePageGateProps {
  feature: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Server component that gates an entire page behind a feature flag.
 * Shows a nice upgrade prompt if the feature is disabled.
 */
export async function FeaturePageGate({
  feature,
  children,
  title = 'Feature Not Available',
  description = 'This feature is not included in your current plan. Contact your administrator to upgrade.',
}: FeaturePageGateProps) {
  const enabled = await hasFeature(feature);

  if (enabled) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="border-dashed border-orange-300 max-w-lg w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
          <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
            <ArrowUpCircle className="h-4 w-4" />
            <span>Upgrade your plan to unlock this feature</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
