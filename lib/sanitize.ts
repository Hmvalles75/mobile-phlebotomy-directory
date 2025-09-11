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