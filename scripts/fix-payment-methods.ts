import { db } from '../lib/db/drizzle';
import { paymentMethods } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixPaymentMethods() {
  const all = await db.select().from(paymentMethods);
  console.log('Total payment methods:', all.length);

  const categoryMap: Record<string, string> = {
    cash: 'cash',
    mbob: 'mobile_banking',
    mpay: 'mobile_banking',
    epay: 'mobile_banking',
    dk_mobile_bank: 'mobile_banking',
    tpay: 'mobile_banking',
    drukpay: 'mobile_banking',
    bank_transfer: 'bank_transfer',
    cheque: 'cheque',
    online_payment: 'online',
  };

  for (const pm of all) {
    const cat = categoryMap[pm.code] || 'other';
    await db.update(paymentMethods)
      .set({ category: cat })
      .where(eq(paymentMethods.id, pm.id));
    console.log(`  ${pm.code} -> ${cat}`);
  }

  // Remove duplicate tPay
  const tpays = all.filter(p => p.code === 'tpay');
  if (tpays.length > 1) {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, tpays[1].id));
    console.log('Deleted duplicate tPay');
  }

  console.log('Done');
  process.exit(0);
}

fixPaymentMethods().catch(e => { console.error(e); process.exit(1); });
