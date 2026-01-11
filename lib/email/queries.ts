import { db } from '@/lib/db/drizzle';
import { emailSettings } from '@/lib/db/schema';

/**
 * Get the global email settings from the database
 * Returns null if no settings are configured
 */
export async function getEmailSettings() {
  const [settings] = await db
    .select()
    .from(emailSettings)
    .limit(1);

  return settings || null;
}
