/**
 * Determine GST classification based on tax rate and exemption status
 */
export function getGSTClassification(
  taxRate: number,
  isTaxExempt: boolean
): 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' {
  if (isTaxExempt) {
    return 'EXEMPT';
  }

  if (taxRate === 0) {
    return 'ZERO_RATED';
  }

  return 'STANDARD';
}

/**
 * Get display label for GST classification
 */
export function getGSTClassificationLabel(
  classification: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT'
): string {
  const labels = {
    STANDARD: 'Standard',
    ZERO_RATED: 'Zero-Rated',
    EXEMPT: 'Exempt',
  };

  return labels[classification];
}

/**
 * Get badge color for GST classification
 */
export function getGSTClassificationColor(
  classification: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT'
): string {
  const colors = {
    STANDARD: 'bg-blue-100 text-blue-700',
    ZERO_RATED: 'bg-green-100 text-green-700',
    EXEMPT: 'bg-gray-100 text-gray-700',
  };

  return colors[classification];
}
