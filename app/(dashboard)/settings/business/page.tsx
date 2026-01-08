'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { updateBusinessSettings } from '@/lib/teams/actions';
import { Team } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

type BusinessFormProps = {
  state: ActionState;
  team?: Team;
};

function BusinessForm({ state, team }: BusinessFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    const fileInput = document.getElementById('logoUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Business Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information (DRC Compliance)</CardTitle>
          <p className="text-sm text-gray-600">
            Required for Bhutan GST compliance with Department of Revenue
            and Customs (DRC)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName" className="mb-2">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Your registered business name"
                defaultValue={team?.businessName || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="tpn" className="mb-2">
                TPN (Tax Payer Number)
              </Label>
              <Input
                id="tpn"
                name="tpn"
                placeholder="e.g., 123456789"
                defaultValue={team?.tpn || ''}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - obtain from DRC if registered
              </p>
            </div>
            <div>
              <Label htmlFor="gstNumber" className="mb-2">
                GST Number
              </Label>
              <Input
                id="gstNumber"
                name="gstNumber"
                placeholder="e.g., GST123456789"
                defaultValue={team?.gstNumber || ''}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                GST Registration Number from DRC
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="licenseNumber" className="mb-2">
              Business License Number
            </Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              placeholder="Business license number"
              defaultValue={team?.licenseNumber || ''}
            />
          </div>

          <div>
            <Label htmlFor="address" className="mb-2">
              Business Address
            </Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Complete business address"
              defaultValue={team?.address || ''}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="mb-2">
                City/Town
              </Label>
              <Input
                id="city"
                name="city"
                placeholder="Thimphu"
                defaultValue={team?.city || ''}
              />
            </div>
            <div>
              <Label htmlFor="dzongkhag" className="mb-2">
                Dzongkhag (District)
              </Label>
              <Input
                id="dzongkhag"
                name="dzongkhag"
                placeholder="Thimphu"
                defaultValue={team?.dzongkhag || ''}
              />
            </div>
            <div>
              <Label htmlFor="postalCode" className="mb-2">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="11001"
                defaultValue={team?.postalCode || ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone" className="mb-2">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+975-2-XXXXXX"
                defaultValue={team?.phone || ''}
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">
                Business Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="business@example.bt"
                defaultValue={team?.email || ''}
              />
            </div>
            <div>
              <Label htmlFor="website" className="mb-2">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.bt"
                defaultValue={team?.website || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
          <p className="text-sm text-gray-600">
            Bank details will be displayed on invoices for customer payments
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName" className="mb-2">
                Bank Name
              </Label>
              <Input
                id="bankName"
                name="bankName"
                placeholder="Bank of Bhutan"
                defaultValue={team?.bankName || ''}
              />
            </div>
            <div>
              <Label htmlFor="bankBranch" className="mb-2">
                Bank Branch
              </Label>
              <Input
                id="bankBranch"
                name="bankBranch"
                placeholder="Thimphu Main Branch"
                defaultValue={team?.bankBranch || ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccountName" className="mb-2">
                Account Name
              </Label>
              <Input
                id="bankAccountName"
                name="bankAccountName"
                placeholder="Your Business Name"
                defaultValue={team?.bankAccountName || ''}
              />
            </div>
            <div>
              <Label htmlFor="bankAccountNumber" className="mb-2">
                Account Number
              </Label>
              <Input
                id="bankAccountNumber"
                name="bankAccountNumber"
                placeholder="XXXXXXXXXX"
                defaultValue={team?.bankAccountNumber || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Configure default invoice preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCurrency" className="mb-2">
                Default Currency <span className="text-red-500">*</span>
              </Label>
              <select
                id="defaultCurrency"
                name="defaultCurrency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue={team?.defaultCurrency || 'BTN'}
                required
              >
                <option value="BTN">BTN - Bhutanese Ngultrum</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            <div>
              <Label htmlFor="invoicePrefix" className="mb-2">
                Invoice Number Prefix
              </Label>
              <Input
                id="invoicePrefix"
                name="invoicePrefix"
                placeholder="INV"
                defaultValue={team?.invoicePrefix || 'INV'}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: INV-2026-0001
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="invoiceTerms" className="mb-2">
              Default Terms & Conditions
            </Label>
            <Textarea
              id="invoiceTerms"
              name="invoiceTerms"
              placeholder="Payment due within 30 days. Late payment subject to interest charges..."
              defaultValue={team?.invoiceTerms || ''}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              These terms will appear on all invoices by default
            </p>
          </div>

          <div>
            <Label htmlFor="invoiceFooter" className="mb-2">
              Invoice Footer
            </Label>
            <Textarea
              id="invoiceFooter"
              name="invoiceFooter"
              placeholder="Thank you for your business!"
              defaultValue={team?.invoiceFooter || ''}
              rows={2}
            />
          </div>

          {/* Logo Upload Section */}
          <div>
            <Label htmlFor="logoUpload" className="mb-2">
              Business Logo
            </Label>
            <p className="text-xs text-gray-500 mb-3">
              Upload your business logo to appear on invoices (Max 2MB, PNG, JPG, or SVG)
            </p>

            <div className="flex items-start gap-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <img
                    src={logoPreview}
                    alt="Business Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  type="file"
                  id="logoUpload"
                  name="logoUpload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="logoUpload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>

                {/* Hidden field to store logo data */}
                {logoPreview && (
                  <input type="hidden" name="logoUrl" value={logoPreview} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessFormWithData({ state }: { state: ActionState }) {
  const { data: team } = useSWR<Team>('/api/team', fetcher);
  return <BusinessForm state={state} team={team} />;
}

export default function BusinessSettingsPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateBusinessSettings,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Business Settings
        </h1>
      </div>

      <form action={formAction} className="space-y-6">
        <Suspense fallback={<BusinessForm state={state} />}>
          <BusinessFormWithData state={state} />
        </Suspense>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {state.success}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Business Settings'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
