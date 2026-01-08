import { z } from 'zod';

/**
 * Coerce string or boolean to boolean
 * Handles form data where checkboxes are sent as strings
 */
export const booleanCoerce = (defaultValue: boolean = false) =>
  z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'on';
    })
    .default(defaultValue);
