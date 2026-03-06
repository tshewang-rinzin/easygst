export type PricingBasis = 'per_unit' | 'per_pax' | 'per_night' | 'per_pax_per_night';

export interface PresetItem {
  description: string;
  unit: string;
  defaultPricingBasis: PricingBasis;
  isTaxExempt?: boolean;
}

export interface CategoryPreset {
  key: string;
  label: string;
  items: PresetItem[];
  defaultTaxExempt?: boolean;
}

export const TOUR_CATEGORIES: CategoryPreset[] = [
  {
    key: 'accommodation',
    label: 'Accommodation',
    items: [
      { description: 'Hotel - Standard Room', unit: 'night', defaultPricingBasis: 'per_night' },
      { description: 'Hotel - Deluxe Room', unit: 'night', defaultPricingBasis: 'per_night' },
      { description: 'Hotel - Suite', unit: 'night', defaultPricingBasis: 'per_night' },
      { description: 'Farmstay / Homestay', unit: 'night', defaultPricingBasis: 'per_night' },
      { description: 'Resort', unit: 'night', defaultPricingBasis: 'per_night' },
    ],
  },
  {
    key: 'domestic_flight',
    label: 'Domestic Flights',
    defaultTaxExempt: true,
    items: [
      { description: 'Druk Air - Paro to Bumthang', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Druk Air - Bumthang to Paro', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Bhutan Airlines - Paro to Bumthang', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
    ],
  },
  {
    key: 'international_flight',
    label: 'International Flights',
    defaultTaxExempt: true,
    items: [
      { description: 'Druk Air - International', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Bhutan Airlines - International', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
    ],
  },
  {
    key: 'transport',
    label: 'Transport',
    items: [
      { description: 'Vehicle Hire (SUV/Coaster)', unit: 'day', defaultPricingBasis: 'per_night' },
      { description: 'Airport Transfer (Paro-Thimphu)', unit: 'trip', defaultPricingBasis: 'per_unit' },
      { description: 'Airport Transfer (Paro-Paro)', unit: 'trip', defaultPricingBasis: 'per_unit' },
      { description: 'Inter-city Transport', unit: 'day', defaultPricingBasis: 'per_night' },
    ],
  },
  {
    key: 'guide',
    label: 'Guide',
    items: [
      { description: 'Licensed Tour Guide', unit: 'day', defaultPricingBasis: 'per_night' },
      { description: 'Trekking Guide', unit: 'day', defaultPricingBasis: 'per_night' },
      { description: 'Cultural Guide', unit: 'day', defaultPricingBasis: 'per_night' },
    ],
  },
  {
    key: 'meals',
    label: 'Meals',
    items: [
      { description: 'Full Board (B/L/D)', unit: 'person/day', defaultPricingBasis: 'per_pax_per_night' },
      { description: 'Half Board (B/D)', unit: 'person/day', defaultPricingBasis: 'per_pax_per_night' },
      { description: 'Breakfast Only', unit: 'person/day', defaultPricingBasis: 'per_pax_per_night' },
      { description: 'Special Dinner / Cultural Evening', unit: 'person', defaultPricingBasis: 'per_pax' },
    ],
  },
  {
    key: 'permits',
    label: 'Permits & Entry Fees',
    defaultTaxExempt: true,
    items: [
      { description: 'Monument Entry Fee', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Trekking Permit', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Restricted Area Permit', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'National Park Fee', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
      { description: 'Camera/Video Fee', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
    ],
  },
  {
    key: 'activities',
    label: 'Activities',
    items: [
      { description: 'Trekking (per day)', unit: 'person/day', defaultPricingBasis: 'per_pax_per_night' },
      { description: 'River Rafting', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'Hot Stone Bath', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'Archery Experience', unit: 'group', defaultPricingBasis: 'per_unit' },
      { description: 'Cultural Program / Show', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'Mountain Biking', unit: 'person/day', defaultPricingBasis: 'per_pax_per_night' },
      { description: 'Meditation / Yoga Session', unit: 'person', defaultPricingBasis: 'per_pax' },
    ],
  },
  {
    key: 'visa',
    label: 'Visa',
    defaultTaxExempt: true,
    items: [
      { description: 'Visa Processing Fee', unit: 'person', defaultPricingBasis: 'per_pax', isTaxExempt: true },
    ],
  },
  {
    key: 'miscellaneous',
    label: 'Miscellaneous',
    items: [
      { description: 'Laundry', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'SIM Card', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'Travel Insurance', unit: 'person', defaultPricingBasis: 'per_pax' },
      { description: 'Tips / Gratuity', unit: 'lump sum', defaultPricingBasis: 'per_unit' },
    ],
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  TOUR_CATEGORIES.map((c) => [c.key, c])
);

export const DEFAULT_INCLUSIONS = [
  'Accommodation as per itinerary',
  'All meals (Breakfast, Lunch, Dinner)',
  'Licensed English-speaking guide',
  'All internal transport',
  'Monument entry fees',
  'Sustainable Development Fee (SDF)',
  'Visa processing',
];

export const DEFAULT_EXCLUSIONS = [
  'International airfare',
  'Travel insurance',
  'Personal expenses',
  'Tips and gratuities',
  'Alcoholic beverages',
  'Laundry services',
];
