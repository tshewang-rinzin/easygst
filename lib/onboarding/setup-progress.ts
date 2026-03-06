import { Team } from '@/lib/db/schema';

export interface SetupStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  href: string;
}

export interface SetupProgress {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  requiredCompletedCount: number;
  requiredTotalCount: number;
  percentage: number;
  allRequiredComplete: boolean;
}

export function getSetupProgress(
  team: Team,
  bankAccountCount: number
): SetupProgress {
  const steps: SetupStep[] = [
    {
      id: 'business_name',
      label: 'Business Name',
      description: 'Set your registered business name',
      completed: !!team.businessName && team.businessName.trim().length > 0,
      required: true,
      href: '/onboarding?step=1',
    },
    {
      id: 'tpn',
      label: 'TPN / GST Number',
      description: 'Add your Tax Payer Number',
      completed: !!team.tpn && team.tpn.trim().length > 0,
      required: true,
      href: '/onboarding?step=1',
    },
    {
      id: 'address',
      label: 'Business Address',
      description: 'Set your business address',
      completed: !!team.address && team.address.trim().length > 0,
      required: true,
      href: '/onboarding?step=2',
    },
    {
      id: 'business_type',
      label: 'Business Type',
      description: 'Select your business category',
      completed: !!team.businessTypeId,
      required: true,
      href: '/onboarding?step=1',
    },
    {
      id: 'logo',
      label: 'Business Logo',
      description: 'Upload your business logo',
      completed: !!team.logoUrl,
      required: false,
      href: '/onboarding?step=3',
    },
    {
      id: 'bank_account',
      label: 'Bank Account',
      description: 'Add at least one bank account',
      completed: bankAccountCount > 0,
      required: true,
      href: '/onboarding?step=4',
    },
    {
      id: 'invoice_settings',
      label: 'Invoice Settings',
      description: 'Customize your invoice prefix or terms',
      completed:
        (!!team.invoicePrefix && team.invoicePrefix !== 'INV') ||
        !!team.invoiceTerms,
      required: false,
      href: '/onboarding?step=5',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const requiredSteps = steps.filter((s) => s.required);
  const requiredCompletedCount = requiredSteps.filter((s) => s.completed).length;
  const requiredTotalCount = requiredSteps.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    steps,
    completedCount,
    totalCount,
    requiredCompletedCount,
    requiredTotalCount,
    percentage,
    allRequiredComplete: requiredCompletedCount === requiredTotalCount,
  };
}
