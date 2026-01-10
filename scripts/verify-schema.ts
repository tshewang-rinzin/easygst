import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function verifySchema() {
  try {
    console.log('Checking if email_verified column exists...');

    const result: any = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expiry')
      ORDER BY column_name;
    `);

    console.log('\nColumns found:');
    console.log(JSON.stringify(result, null, 2));

    const rows = Array.isArray(result) ? result : (result.rows || []);

    if (rows.length === 3) {
      console.log('\n✓ All email verification columns exist!');
    } else {
      console.log(`\n✗ Missing columns. Found ${rows.length} out of 3 expected columns.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

verifySchema();
