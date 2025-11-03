import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    return dirty;
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false
  });
}

export function sanitizeJSONLD(data: any): string {
  const jsonString = JSON.stringify(data, null, 2);

  if (typeof window === 'undefined') {
    return jsonString;
  }

  return DOMPurify.sanitize(jsonString, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false
  });
}

/**
 * Sanitizes display values to replace "false", "False", "true", "True" with user-friendly text
 * @param value - The value to sanitize
 * @param trueText - Text to display for true values (default: "Yes")
 * @param falseText - Text to display for false values (default: "Not available")
 * @returns Sanitized display value
 */
export function sanitizeDisplayValue(
  value: any,
  trueText: string = 'Yes',
  falseText: string = 'Not available'
): string {
  if (value === null || value === undefined || value === '') {
    return falseText;
  }

  const stringValue = String(value).trim();
  const lowerValue = stringValue.toLowerCase();

  // Handle boolean-like values
  if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
    return trueText;
  }

  if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
    return falseText;
  }

  // Return original value if it's not a boolean-like value
  return stringValue;
}