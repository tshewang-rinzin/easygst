import type { PricingBasis } from './category-presets';

// Form data types for create/edit

export interface TourInvoiceGuestFormData {
  id?: string;
  guestName: string;
  nationality: string;
  passportNumber?: string;
  visaNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  specialRequirements?: string;
}

export interface TourInvoiceItemFormData {
  id?: string;
  category: string;
  description: string;
  quantity: string;
  unit?: string;
  unitPrice: string;
  pricingBasis: PricingBasis;
  numberOfDays?: number;
  numberOfPersons?: number;
  lineTotal: string;
  discountPercent?: string;
  discountAmount?: string;
  taxRate: string;
  taxAmount: string;
  isTaxExempt: boolean;
  itemTotal: string;
  sortOrder: number;
}

export interface TourInvoiceFormData {
  customerId: string;
  tourName: string;
  tourType: string;
  arrivalDate?: string;
  departureDate?: string;
  numberOfNights?: number;
  numberOfGuests: number;
  guestNationality: string;
  tourGuide?: string;
  currency: string;
  dueDate?: string;

  items: TourInvoiceItemFormData[];
  guests: TourInvoiceGuestFormData[];

  inclusions: string[];
  exclusions: string[];

  paymentTerms?: string;
  notes?: string;
  customerNotes?: string;
  termsAndConditions?: string;
}

export const TOUR_TYPES = [
  { value: 'cultural', label: 'Cultural Tour' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'festival', label: 'Festival Tour' },
  { value: 'custom', label: 'Custom Tour' },
] as const;

export const NATIONALITIES = [
  { value: 'Indian', label: '🇮🇳 Indian', sdfExempt: true },
  { value: 'Bangladeshi', label: '🇧🇩 Bangladeshi', sdfExempt: true },
  { value: 'Maldivian', label: '🇲🇻 Maldivian', sdfExempt: true },
  { value: 'American', label: '🇺🇸 American' },
  { value: 'British', label: '🇬🇧 British' },
  { value: 'German', label: '🇩🇪 German' },
  { value: 'French', label: '🇫🇷 French' },
  { value: 'Japanese', label: '🇯🇵 Japanese' },
  { value: 'Chinese', label: '🇨🇳 Chinese' },
  { value: 'Australian', label: '🇦🇺 Australian' },
  { value: 'Thai', label: '🇹🇭 Thai' },
  { value: 'Singaporean', label: '🇸🇬 Singaporean' },
  { value: 'Canadian', label: '🇨🇦 Canadian' },
  { value: 'Korean', label: '🇰🇷 Korean' },
  { value: 'Dutch', label: '🇳🇱 Dutch' },
  { value: 'Swiss', label: '🇨🇭 Swiss' },
  { value: 'Italian', label: '🇮🇹 Italian' },
  { value: 'Spanish', label: '🇪🇸 Spanish' },
  { value: 'Other', label: 'Other' },
] as const;

export const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'BTN', label: 'BTN - Bhutanese Ngultrum' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
] as const;

export type TourInvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
