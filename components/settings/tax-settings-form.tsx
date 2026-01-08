'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { updateTaxSettings } from '@/lib/teams/tax-actions';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Team, TaxClassification } from '@/lib/db/schema';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

interface TaxSettingsFormProps {
  team: Team | null;
}

export function TaxSettingsForm({ team }: TaxSettingsFormProps) {
  const [gstRegistered, setGstRegistered] = useState(team?.gstRegistered ?? false);
  const { data: taxClassifications, error: taxError } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);
  const [selectedRate, setSelectedRate] = useState(
    team?.defaultGstRate ? parseFloat(team.defaultGstRate).toString() : '5'
  );
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateTaxSettings,
    {}
  );

  // Filter taxable classifications (Standard and Zero-Rated only)
  const taxableClassifications = taxClassifications?.filter(
    (c) => c.canClaimInputCredits && c.code !== 'EXEMPT'
  ) || [];

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Default GST Configuration</CardTitle>
          <CardDescription>
            Set the default GST rate that will apply to all products and services.
            You can override this rate for individual products if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Checkbox
              id="gstRegistered"
              name="gstRegistered"
              checked={gstRegistered}
              onCheckedChange={(checked) => setGstRegistered(checked === true)}
            />
            <div className="flex-1">
              <Label
                htmlFor="gstRegistered"
                className="text-sm font-medium cursor-pointer"
              >
                Business is GST Registered with DRC
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Check this if your business is registered for GST with the Department
                of Revenue and Customs
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="defaultGstRate" className="mb-2 flex items-center justify-between">
              <span>Default GST Rate (%) <span className="text-red-500">*</span></span>
              <Link
                href="/settings/tax-classifications"
                className="text-xs text-orange-600 hover:text-orange-700"
              >
                Manage Classifications
              </Link>
            </Label>
            <div className="flex gap-3">
              <select
                id="defaultGstRate"
                name="defaultGstRate"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedRate}
                onChange={(e) => setSelectedRate(e.target.value)}
                required
              >
                {taxableClassifications.length > 0 ? (
                  taxableClassifications.map((classification) => (
                    <option
                      key={classification.id}
                      value={parseFloat(classification.taxRate).toString()}
                    >
                      {parseFloat(classification.taxRate)}% - {classification.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="5">5% - Standard-Rated</option>
                    <option value="0">0% - Zero-Rated</option>
                  </>
                )}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This default rate will be automatically applied to all new products.
              Only taxable classifications (Standard &amp; Zero-Rated) are shown here.
              For exempt supplies, mark products as "Tax Exempt" individually.
            </p>
            {taxError && (
              <p className="text-xs text-red-600 mt-2">
                Error loading tax classifications. Using fallback options.
              </p>
            )}
            {taxableClassifications.length === 0 && !taxError && (
              <p className="text-xs text-orange-600 mt-2">
                <Link href="/settings/tax-classifications" className="hover:underline">
                  Configure tax classifications
                </Link> or use the "Reset to Defaults" button to create Standard (5%) and Zero-Rated (0%) classifications.
              </p>
            )}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    <strong>Standard (5%):</strong> Most goods and services - GST charged, input credits claimable
                  </li>
                  <li>
                    <strong>Zero-Rated (0%):</strong> Special supplies (e.g., exports) - 0% GST, input credits claimable
                  </li>
                  <li>
                    <strong>Exempt:</strong> Specific supplies (e.g., some financial/healthcare) - no GST, no input credits
                  </li>
                  <li>
                    The default rate applies to new products; existing products keep their rates
                  </li>
                  <li>
                    Always comply with Bhutan DRC GST Act and regulations
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{state.success}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save GST Settings'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
