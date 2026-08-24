/**
 * OWASP Security Utility for Client-side & database security
 */

/**
 * Sanitizes input to prevent Cross-Site Scripting (XSS) and remove potential malicious scripts/tags.
 * Escapes HTML characters.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Strip script tags and HTML elements
  let clean = input.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  clean = clean.replace(/<[^>]*>/g, '');
  
  // Escape HTML characters
  return clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates email with OWASP-recommended standard regex.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Standard RFC 5322 email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates phone numbers to ensure they contain only standard phone characters (digits, +, -, spaces).
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Allows optional leading +, digits, spaces, and hyphens. Length between 7 and 15 digits.
  const cleanPhone = phone.replace(/[\s-()]/g, '');
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validates text length limits.
 */
export function validateLength(text: string, min: number, max: number): boolean {
  if (typeof text !== 'string') return false;
  const len = text.trim().length;
  return len >= min && len <= max;
}

/**
 * Client-Side Rate Limiter to prevent spamming actions (e.g., placing too many orders, contact spam).
 * Stores attempts in localStorage.
 * 
 * @param actionKey Unique key for the action (e.g., 'submit_order', 'contact_form')
 * @param limit Max allowed attempts in the time window
 * @param windowMs Time window in milliseconds (default: 1 minute)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(actionKey: string, limit: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const storageKey = `rate_limit_${actionKey}`;
  const data = localStorage.getItem(storageKey);
  
  if (!data) {
    const newData = {
      timestamps: [now],
      resetTime: now + windowMs
    };
    localStorage.setItem(storageKey, JSON.stringify(newData));
    return { allowed: true, remaining: limit - 1, resetTime: newData.resetTime };
  }
  
  try {
    const parsed = JSON.parse(data);
    // Filter out timestamps outside the window
    const validTimestamps = parsed.timestamps.filter((t: number) => now - t < windowMs);
    
    if (validTimestamps.length >= limit) {
      const oldest = validTimestamps[0];
      const resetTime = oldest + windowMs;
      return { allowed: false, remaining: 0, resetTime };
    }
    
    validTimestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify({
      timestamps: validTimestamps,
      resetTime: now + windowMs
    }));
    
    return { allowed: true, remaining: limit - validTimestamps.length, resetTime: now + windowMs };
  } catch (e) {
    // Reset state in case of corrupt localStorage data
    const newData = {
      timestamps: [now],
      resetTime: now + windowMs
    };
    localStorage.setItem(storageKey, JSON.stringify(newData));
    return { allowed: true, remaining: limit - 1, resetTime: newData.resetTime };
  }
}
