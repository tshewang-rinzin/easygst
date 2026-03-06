'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Loader2,
  Upload,
  X,
  Check,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
  Building2,
  MapPin,
  Image as ImageIcon,
  Landmark,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DZONGKHAGS = [
  'Bumthang', 'Chhukha', 'Dagana', 'Gasa', 'Haa', 'Lhuentse', 'Mongar',
  'Paro', 'Pemagatshel', 'Punakha', 'Samdrup Jongkhar', 'Samtse', 'Sarpang',
  'Thimphu', 'Trashigang', 'Trashiyangtse', 'Trongsa', 'Tsirang',
  'Wangdue Phodrang', 'Zhemgang',
];

const STEPS = [
  { label: 'Business Details', icon: Building2 },
  { label: 'Address', icon: MapPin },
  { label: 'Logo', icon: ImageIcon },
  { label: 'Bank Account', icon: Landmark },
  { label: 'Invoice Settings', icon: FileText },
  { label: 'Complete', icon: CheckCircle2 },
];

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface TeamData {
  id: string;
  businessName?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  businessTypeId?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  logoUrl?: string | null;
  invoicePrefix?: string | null;
  defaultCurrency?: string;
  invoiceTerms?: string | null;
  invoiceTemplate?: string | null;
}

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState(
    Math.min(Math.max(initialStep, 1), 6)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: team, mutate: mutateTeam } = useSWR<TeamData>(
    '/api/team',
    fetcher
  );
  const { data: businessTypesData } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/master-products/business-types',
    fetcher
  );
  const { data: setupProgress, mutate: mutateProgress } = useSWR(
    '/api/setup-progress',
    fetcher
  );

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [tpn, setTpn] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [dzongkhag, setDzongkhag] = useState('');

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultCurrency, setDefaultCurrency] = useState('BTN');
  const [invoiceTerms, setInvoiceTerms] = useState('');
  const [invoiceTemplate, setInvoiceTemplate] = useState('classic');

  // Load team data into form
  useEffect(() => {
    if (team) {
      setBusinessName(team.businessName || '');
      setBusinessTypeId(team.businessTypeId || '');
      setTpn(team.tpn || '');
      setGstNumber(team.gstNumber || '');
      setLicenseNumber(team.licenseNumber || '');
      setAddress(team.address || '');
      setCity(team.city || '');
      setDzongkhag(team.dzongkhag || '');
      setLogoPreview(team.logoUrl || null);
      setInvoicePrefix(team.invoicePrefix || 'INV');
      setDefaultCurrency(team.defaultCurrency || 'BTN');
      setInvoiceTerms(team.invoiceTerms || '');
      setInvoiceTemplate(team.invoiceTemplate || 'classic');
    }
  }, [team]);

  const saveBusinessDetails = async () => {
    if (!businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!tpn.trim()) {
      setError('TPN is required');
      return false;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('businessName', businessName);
      formData.append('businessTypeId', businessTypeId);
      formData.append('tpn', tpn);
      formData.append('gstNumber', gstNumber);
      formData.append('licenseNumber', licenseNumber);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('dzongkhag', dzongkhag);
      formData.append('defaultCurrency', defaultCurrency);
      formData.append('invoicePrefix', invoicePrefix || 'INV');
      formData.append('logoUrl', logoPreview || '');
      formData.append('invoiceTerms', invoiceTerms);

      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessTypeId: businessTypeId || undefined,
          tpn,
          gstNumber,
          licenseNumber,
          address,
          city,
          dzongkhag,
          defaultCurrency,
          invoicePrefix: invoicePrefix || 'INV',
          logoUrl: logoPreview || '',
          invoiceTerms,
          invoiceTemplate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return false;
      }
      await mutateTeam();
      await mutateProgress();
      return true;
    } catch {
      setError('Failed to save business details');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBankAccount = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError('Bank name, account number, and account holder name are required');
      return false;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountNumber,
          accountName,
          branch: bankBranch,
          paymentMethod: 'bank_transfer',
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save bank account');
        return false;
      }
      await mutateProgress();
      return true;
    } catch {
      setError('Failed to save bank account');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setError('');
    if (currentStep === 1) {
      const ok = await saveBusinessDetails();
      if (!ok) return;
    } else if (currentStep === 2) {
      const ok = await saveBusinessDetails();
      if (!ok) return;
    } else if (currentStep === 3) {
      // Logo step - save if changed
      await saveBusinessDetails();
    } else if (currentStep === 4) {
      if (bankName.trim()) {
        const ok = await saveBankAccount();
        if (!ok) return;
      }
    } else if (currentStep === 5) {
      await saveBusinessDetails();
    }
    setCurrentStep((s) => Math.min(s + 1, 6));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSkip = () => {
    setError('');
    setCurrentStep((s) => Math.min(s + 1, 6));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' });
      router.push('/dashboard');
    } catch {
      setError('Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isOptionalStep = currentStep === 3 || currentStep === 5;
  const isBankStep = currentStep === 4;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-orange-500 text-white'
                      : isActive
                      ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isActive ? 'text-orange-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 ${
                    stepNum < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card className="shadow-lg">
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Tell us about your business for DRC compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your registered business name"
                />
              </div>
              <div>
                <Label htmlFor="businessTypeId">Business Type</Label>
                <select
                  id="businessTypeId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={businessTypeId}
                  onChange={(e) => setBusinessTypeId(e.target.value)}
                >
                  <option value="">Select business type</option>
                  {businessTypesData?.businessTypes?.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.icon ? `${bt.icon} ` : ''}
                      {bt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tpn">
                    TPN (Tax Payer Number) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tpn"
                    value={tpn}
                    onChange={(e) => setTpn(e.target.value)}
                    placeholder="e.g., 123456789"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g., GST123456789"
                    maxLength={20}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="licenseNumber">Business License Number</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="License number"
                />
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>
                Where is your business located?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete business address"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City / Town</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Thimphu"
                  />
                </div>
                <div>
                  <Label htmlFor="dzongkhag">Dzongkhag</Label>
                  <select
                    id="dzongkhag"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={dzongkhag}
                    onChange={(e) => setDzongkhag(e.target.value)}
                  >
                    <option value="">Select dzongkhag</option>
                    {DZONGKHAGS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Business Logo</CardTitle>
              <CardDescription>
                Upload your logo to display on invoices (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {logoPreview ? (
                  <div className="relative w-40 h-40 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        const input = document.getElementById('logoUpload') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="logoUpload"
                    className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG (max 2MB)</span>
                  </label>
                )}
                <input
                  type="file"
                  id="logoUpload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {logoPreview && (
                  <label
                    htmlFor="logoUpload"
                    className="text-sm text-orange-600 cursor-pointer hover:underline"
                  >
                    Change logo
                  </label>
                )}
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Bank Account</CardTitle>
              <CardDescription>
                Add a bank account for payment details on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bankName">
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Bank of Bhutan"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Your account number"
                />
              </div>
              <div>
                <Label htmlFor="accountName">
                  Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name on the account"
                />
              </div>
              <div>
                <Label htmlFor="bankBranch">Branch (optional)</Label>
                <Input
                  id="bankBranch"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="Branch name"
                />
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Customize how your invoices look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: {invoicePrefix || 'INV'}-2026-0001
                  </p>
                </div>
                <div>
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <select
                    id="defaultCurrency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                  >
                    <option value="BTN">BTN - Bhutanese Ngultrum</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="invoiceTerms">Default Payment Terms</Label>
                <Textarea
                  id="invoiceTerms"
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  placeholder="Payment due within 30 days..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Invoice Template</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {['classic', 'modern', 'minimal'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setInvoiceTemplate(t)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        invoiceTemplate === t
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-medium capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 6 && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <PartyPopper className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">You&apos;re all set! 🎉</CardTitle>
              <CardDescription>
                Your business is ready to start invoicing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {setupProgress && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Setup Progress</span>
                    <span className="font-medium">
                      {setupProgress.completedCount}/{setupProgress.totalCount} steps
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${setupProgress.percentage}%` }}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    {setupProgress.steps?.map((step: any) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        {step.completed ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={
                            step.completed ? 'text-gray-700' : 'text-gray-400'
                          }
                        >
                          {step.label}
                          {!step.required && (
                            <span className="text-xs text-gray-400 ml-1">
                              (optional)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && currentStep < 6 && (
            <Button variant="outline" onClick={handleBack} disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(isOptionalStep || isBankStep) && currentStep < 6 && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={saving}
            >
              Skip for now
            </button>
          )}
          {isBankStep && !bankName.trim() && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Invoices won&apos;t show payment details</span>
            </div>
          )}
          {currentStep < 6 ? (
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Go to Dashboard'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <OnboardingWizardContent />
    </Suspense>
  );
}
