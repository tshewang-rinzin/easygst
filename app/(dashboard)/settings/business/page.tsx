'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload, X, Check, ChevronsUpDown, ShoppingCart, Utensils, Bed, Store, Wrench, Pill, Shirt, Monitor, HardHat, Truck, Leaf, GraduationCap, HeartPulse, Briefcase, Factory, Code, Car, Palette, BookOpen, Sofa, Scissors, Building, Video, CircleDot, Plane, LucideIcon } from 'lucide-react';
import { updateBusinessSettings } from '@/lib/teams/actions';
import { Team } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string | null;
  paymentMethod: string;
  isDefault: boolean;
  isActive: boolean;
}

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'utensils': Utensils,
  'bed': Bed,
  'store': Store,
  'wrench': Wrench,
  'pill': Pill,
  'shirt': Shirt,
  'monitor': Monitor,
  'hard-hat': HardHat,
  'truck': Truck,
  'leaf': Leaf,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'briefcase': Briefcase,
  'factory': Factory,
  'code': Code,
  'car': Car,
  'palette': Palette,
  'book-open': BookOpen,
  'sofa': Sofa,
  'scissors': Scissors,
  'building': Building,
  'video': Video,
  'circle-dot': CircleDot,
  'plane': Plane,
};

function getIcon(iconName?: string) {
  if (!iconName) return CircleDot;
  return ICON_MAP[iconName] || CircleDot;
}

function BusinessTypeSelector({ teamBusinessTypeId }: { teamBusinessTypeId?: string | null }) {
  const { data: businessTypes } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/master-products/business-types',
    fetcher
  );
  const [showCatalogPrompt, setShowCatalogPrompt] = useState(false);
  const [selectedType, setSelectedType] = useState(teamBusinessTypeId || '');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleBusinessTypeChange = (value: string) => {
    setSelectedType(value);
    setOpen(false);
    setSearch('');
    if (value && value !== teamBusinessTypeId) {
      setShowCatalogPrompt(true);
    }
  };

  const selectedBt = businessTypes?.businessTypes.find((bt) => bt.id === selectedType);
  const filteredTypes = businessTypes?.businessTypes.filter((bt) =>
    bt.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <>
      <div>
        <Label htmlFor="businessTypeId" className="mb-2">
          Business Type
        </Label>
        <input type="hidden" name="businessTypeId" value={selectedType} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {selectedBt ? (
              <span className="flex items-center gap-2">
                {(() => { const Icon = getIcon(selectedBt.icon); return <Icon className="h-4 w-4 text-gray-500" />; })()}
                {selectedBt.name}
              </span>
            ) : (
              <span className="text-gray-500">Select business type</span>
            )}
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </button>

          {open && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search business type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-auto">
                {filteredTypes.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No business type found.</div>
                ) : (
                  filteredTypes.map((bt) => {
                    const Icon = getIcon(bt.icon);
                    return (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => handleBusinessTypeChange(bt.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{bt.name}</div>
                          {bt.description && (
                            <div className="text-xs text-gray-500 truncate">{bt.description}</div>
                          )}
                        </div>
                        {bt.id === selectedType && <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Choose your business category to access relevant product catalogs
        </p>
      </div>

      {/* Catalog Prompt */}
      {showCatalogPrompt && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                🛍️
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-1">
                  Browse products for your business type?
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  We have a catalog of products specifically curated for your business type. 
                  You can browse and add them to your inventory.
                </p>
                <div className="flex gap-2">
                  <Link href="/products/catalog">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Browse Catalog
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowCatalogPrompt(false)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function DefaultBankAccountCard() {
  const { data: bankAccounts, mutate } = useSWR<BankAccount[]>('/api/bank-accounts', fetcher);
  const [saving, setSaving] = useState(false);

  const activeAccounts = bankAccounts?.filter((a) => a.isActive) || [];
  const defaultAccount = activeAccounts.find((a) => a.isDefault);

  const handleSetDefault = async (accountId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/bank-accounts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultAccountId: accountId }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to set default bank account:', err);
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Default Bank Account</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              This bank account will be displayed on invoices for customer payments
            </p>
          </div>
          <Link href="/settings/bank-accounts">
            <Button variant="outline" size="sm">
              Manage Bank Accounts
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeAccounts.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="mb-3">No bank accounts configured yet.</p>
            <Link href="/settings/bank-accounts">
              <Button variant="outline" size="sm">
                Add Bank Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  account.isDefault
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{account.bankName}</p>
                    {account.branch && (
                      <span className="text-xs text-gray-500">({account.branch})</span>
                    )}
                    {account.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {account.accountName} · ****{account.accountNumber.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {account.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                {!account.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleSetDefault(account.id)}
                  >
                    Set as Default
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          <BusinessTypeSelector teamBusinessTypeId={team?.businessTypeId} />
          
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

      {/* Default Bank Account Card */}
      <DefaultBankAccountCard />

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
