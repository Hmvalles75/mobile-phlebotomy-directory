import { z } from 'zod';

// Provider API query parameters schema
export const providerQuerySchema = z.object({
  state: z.string().min(2).max(2).optional(),
  city: z.string().min(1).max(100).optional(),
  service: z.string().min(1).max(100).optional(),
  search: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['name', 'rating', 'distance']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

// City API query parameters schema
export const cityQuerySchema = z.object({
  state: z.string().min(2).max(2),
  city: z.string().min(1).max(100),
  search: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

// Validate and sanitize input
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }
    return { success: false, error: 'Invalid input' };
  }
}

// Sanitize string input to prevent injection
export function sanitizeString(input: string): string {
  // Remove any control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 500) // Limit length
    .trim();
}

// Sanitize path to prevent directory traversal
export function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/[\/\\]+/g, '/')
    .replace(/^[\/\\]/, '');
}