/**
 * Formats a price value to thousands format with dots (e.g. 42.000 or 120.000).
 */
export function formatThousandsPrice(rawVal: string | number | undefined | null): string {
  if (rawVal === undefined || rawVal === null) return '';
  let str = rawVal.toString().trim();
  if (!str) return '';

  // Remove currency symbols, e.g. '$' or 'COP'
  str = str.replace(/[$]/g, '').replace(/COP/gi, '').trim();

  if (!str) return '';

  // If already formatted like "42.000" or "120.000" or "1.200.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    return str;
  }

  let num: number;

  // Check if string has decimal format like "42.00" or "60.0"
  if (str.includes('.') && /^\d+\.\d{1,2}$/.test(str)) {
    const parts = str.split('.');
    const integerPart = parseInt(parts[0], 10) || 0;
    // In COP context, e.g. 42.00 or 60.00 represents 42 or 60 thousands
    num = integerPart * 1000;
  } else {
    // Extract numeric digits
    const cleanDigits = str.replace(/[^0-9]/g, '');
    num = parseInt(cleanDigits, 10);
    if (isNaN(num)) return str;
    // If number is < 1000 and > 0, scale to thousands
    if (num < 1000 && num > 0) {
      num = num * 1000;
    }
  }

  // Format with dot as thousands separator (e.g., 42000 -> 42.000)
  return num.toLocaleString('es-CO').replace(/,/g, '.');
}

/**
 * Gets the formatted original price string for display with thousands (e.g. "42.000")
 */
export function getFormattedOriginalPrice(
  originalPrice?: string,
  price?: string,
  offer?: number
): string | null {
  let valToFormat: string | number | undefined = originalPrice;

  // If originalPrice is not provided, calculate from offer % if available
  if ((!valToFormat || valToFormat === '') && offer && offer > 0 && price) {
    const rawPrice = price.toString().replace(/[$]/g, '').replace(/COP/gi, '').trim();
    let priceNum = parseFloat(rawPrice);
    if (!isNaN(priceNum) && priceNum > 0) {
      if (priceNum < 1000) {
        priceNum = priceNum * 1000;
      }
      valToFormat = Math.round(priceNum / (1 - offer / 100));
    }
  }

  if (!valToFormat) return null;

  const formatted = formatThousandsPrice(valToFormat);

  // If original price equals current price, don't show strikethrough
  if (price) {
    const currentPriceFormatted = formatThousandsPrice(price);
    if (formatted === currentPriceFormatted) return null;
  }

  return formatted;
}
