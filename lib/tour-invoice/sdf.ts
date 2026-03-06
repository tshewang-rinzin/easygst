/**
 * SDF (Sustainable Development Fee) Calculation
 * Rate set by Tourism Council of Bhutan (TCB)
 */

const SDF_EXEMPT_NATIONALITIES = [
  'indian',
  'bangladeshi',
  'maldivian',
];

const SDF_RATE_USD = 100; // USD per person per night

export interface SDFResult {
  sdfPerPersonPerNight: number;
  sdfTotal: number;
  isExempt: boolean;
}

export interface SDFBreakdownItem {
  nationality: string;
  count: number;
  ratePerNight: number;
  nights: number;
  subtotal: number;
  isExempt: boolean;
}

export interface SDFMixedResult {
  totalSDF: number;
  breakdown: SDFBreakdownItem[];
  exemptCount: number;
  chargeableCount: number;
  isMixed: boolean;
}

export function isSdfExempt(nationality: string): boolean {
  return SDF_EXEMPT_NATIONALITIES.includes(nationality.toLowerCase());
}

export function calcSDF(
  nationality: string,
  guests: number,
  nights: number | null | undefined
): SDFResult {
  if (isSdfExempt(nationality)) {
    return { sdfPerPersonPerNight: 0, sdfTotal: 0, isExempt: true };
  }

  const effectiveNights = nights ?? 0;
  const sdfPerPersonPerNight = SDF_RATE_USD;
  const sdfTotal = sdfPerPersonPerNight * guests * effectiveNights;

  return { sdfPerPersonPerNight, sdfTotal, isExempt: false };
}

/**
 * Calculate SDF for mixed nationality groups.
 * Groups guests by nationality and calculates per-group SDF.
 */
export function calcSDFMixed(
  guests: Array<{ nationality: string }>,
  nights: number | null | undefined
): SDFMixedResult {
  const effectiveNights = nights ?? 0;

  // Group by nationality
  const grouped: Record<string, number> = {};
  for (const guest of guests) {
    const nat = guest.nationality || 'Unknown';
    grouped[nat] = (grouped[nat] || 0) + 1;
  }

  const nationalities = Object.keys(grouped);
  const isMixed = nationalities.length > 1;

  const breakdown: SDFBreakdownItem[] = nationalities.map((nationality) => {
    const count = grouped[nationality];
    const exempt = isSdfExempt(nationality);
    const ratePerNight = exempt ? 0 : SDF_RATE_USD;
    const subtotal = ratePerNight * count * effectiveNights;

    return {
      nationality,
      count,
      ratePerNight,
      nights: effectiveNights,
      subtotal,
      isExempt: exempt,
    };
  });

  const totalSDF = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  const exemptCount = breakdown.filter((b) => b.isExempt).reduce((sum, b) => sum + b.count, 0);
  const chargeableCount = guests.length - exemptCount;

  return { totalSDF, breakdown, exemptCount, chargeableCount, isMixed };
}
