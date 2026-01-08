import { getTeamForUser } from '@/lib/db/queries';
import { TaxSettingsForm } from '@/components/settings/tax-settings-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function TaxSettingsPage() {
  const team = await getTeamForUser();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            GST Configuration
          </h1>
          <p className="text-sm text-gray-500">
            Configure GST settings for your business as per DRC guidelines
          </p>
        </div>

        <div className="space-y-6">
          {/* GST Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Bhutan GST</CardTitle>
              <CardDescription>
                Goods and Services Tax (GST) in Bhutan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-blue-600 font-semibold mt-0.5">5%</div>
                  <div>
                    <div className="font-medium text-blue-900">
                      Standard-Rated (5%)
                    </div>
                    <div className="text-sm text-blue-700">
                      Applies to most goods and services in Bhutan
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-green-600 font-semibold mt-0.5">0%</div>
                  <div>
                    <div className="font-medium text-green-900">
                      Zero-Rated (0%)
                    </div>
                    <div className="text-sm text-green-700">
                      0% GST charged but input tax credits can be claimed (e.g., exports, international services)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-gray-600 font-semibold mt-0.5">—</div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Exempt
                    </div>
                    <div className="text-sm text-gray-700">
                      No GST charged and input tax credits cannot be claimed (e.g., certain financial services, healthcare, education)
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <p className="font-medium text-amber-900 mb-2">Understanding the Difference:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs">
                  <li><strong>Standard (5%):</strong> Regular taxable supplies - charge 5% GST and claim input credits</li>
                  <li><strong>Zero-Rated (0%):</strong> Special taxable supplies at 0% - no GST charged but you can claim input credits</li>
                  <li><strong>Exempt:</strong> Non-taxable supplies - no GST charged and you cannot claim input credits</li>
                  <li>Always refer to the latest DRC GST Act and regulations for proper classification</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings Form */}
          <TaxSettingsForm team={team} />
        </div>
      </div>
    </section>
  );
}
