const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
}

/**
 * Convert a number to words (supports up to 999,999,999,999)
 * e.g., 930000.50 → "Nine Hundred and Thirty Thousand Ngultrum and Fifty Chetrum Only"
 */
export function amountInWords(amount: number | string, currency: string = 'BTN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) return '';

  const currencyNames: Record<string, { main: string; sub: string }> = {
    BTN: { main: 'Ngultrum', sub: 'Chetrum' },
    USD: { main: 'Dollar', sub: 'Cent' },
    INR: { main: 'Rupee', sub: 'Paisa' },
  };
  const curr = currencyNames[currency] || { main: currency, sub: 'cents' };

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);

  if (wholePart === 0 && decimalPart === 0) return `Zero ${curr.main} Only`;

  const billions = Math.floor(wholePart / 1000000000);
  const millions = Math.floor((wholePart % 1000000000) / 1000000);
  const thousands = Math.floor((wholePart % 1000000) / 1000);
  const remainder = wholePart % 1000;

  let words = '';
  if (billions) words += convertGroup(billions) + ' Billion ';
  if (millions) words += convertGroup(millions) + ' Million ';
  if (thousands) words += convertGroup(thousands) + ' Thousand ';
  if (remainder) words += convertGroup(remainder);

  words = words.trim();

  if (decimalPart > 0) {
    return `${words} ${curr.main} and ${convertGroup(decimalPart)} ${curr.sub} Only`;
  }
  return `${words} ${curr.main} Only`;
}
