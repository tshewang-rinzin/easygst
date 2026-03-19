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
      href: '/settings/business',
    },
    {
      id: 'tpn',
      label: 'TPN / GST Number',
      description: 'Add your Tax Payer Number',
      completed: !!team.tpn && team.tpn.trim().length > 0,
      required: true,
      href: '/settings/business',
    },
    {
      id: 'address',
      label: 'Business Address',
      description: 'Set your business address',
      completed: !!team.address && team.address.trim().length > 0,
      required: true,
      href: '/settings/business',
    },
    {
      id: 'business_type',
      label: 'Business Type',
      description: 'Select your business category',
      completed: !!team.businessTypeId,
      required: true,
      href: '/settings/business',
    },
    {
      id: 'logo',
      label: 'Business Logo',
      description: 'Upload your business logo',
      completed: !!team.logoUrl,
      required: false,
      href: '/settings/business',
    },
    {
      id: 'bank_account',
      label: 'Bank Account',
      description: 'Add at least one bank account',
      completed: bankAccountCount > 0,
      required: true,
      href: '/settings/bank-accounts',
    },
    {
      id: 'invoice_settings',
      label: 'Invoice Settings',
      description: 'Customize your invoice prefix or terms',
      completed:
        (!!team.invoicePrefix && team.invoicePrefix !== 'INV') ||
        !!team.invoiceTerms,
      required: false,
      href: '/settings/numbering',
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
