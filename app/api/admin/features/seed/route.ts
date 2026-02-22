import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { features, plans, planFeatures } from '@/lib/db/schema';
import { getPlatformAdmin } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

const DEFAULT_FEATURES = [
  // Sales
  { code: 'invoices', name: 'Tax Invoices', module: 'sales', description: 'Create and manage tax invoices', sortOrder: 1 },
  { code: 'cash_sales', name: 'Cash Sales', module: 'sales', description: 'Quick point-of-sale invoicing', sortOrder: 2 },
  { code: 'quotations', name: 'Quotations', module: 'sales', description: 'Create quotations and convert to invoices', sortOrder: 3 },
  { code: 'credit_notes', name: 'Credit Notes', module: 'sales', description: 'Issue credit notes and refunds', sortOrder: 4 },
  { code: 'contracts', name: 'Contracts', module: 'sales', description: 'Project and AMC contract management', sortOrder: 5 },
  { code: 'recurring_invoices', name: 'Recurring Invoices', module: 'sales', description: 'Auto-generate invoices on schedule', sortOrder: 6 },

  // Purchases
  { code: 'supplier_bills', name: 'Supplier Bills', module: 'purchases', description: 'Record and manage supplier bills', sortOrder: 1 },
  { code: 'debit_notes', name: 'Debit Notes', module: 'purchases', description: 'Issue debit notes to suppliers', sortOrder: 2 },

  // Payments
  { code: 'payments', name: 'Payments', module: 'payments', description: 'Record and track payments', sortOrder: 1 },
  { code: 'advances', name: 'Advances', module: 'payments', description: 'Customer and supplier advance tracking', sortOrder: 2 },

  // Inventory
  { code: 'inventory', name: 'Inventory Management', module: 'inventory', description: 'Stock tracking, adjustments, low stock alerts', sortOrder: 1 },
  { code: 'product_variants', name: 'Product Variants', module: 'inventory', description: 'Size, color, and other variant attributes', sortOrder: 2 },

  // Compliance
  { code: 'gst_returns', name: 'GST Returns', module: 'compliance', description: 'Prepare and file GST returns', sortOrder: 1 },
  { code: 'period_lock', name: 'Period Lock', module: 'compliance', description: 'Lock accounting periods', sortOrder: 2 },
  { code: 'gst_reports', name: 'GST Reports', module: 'compliance', description: 'Output/Input GST and compliance reports', sortOrder: 3 },

  // Communication
  { code: 'email_invoices', name: 'Email Invoices', module: 'communication', description: 'Send invoices and quotations via email', sortOrder: 1 },
  { code: 'payment_reminders', name: 'Payment Reminders', module: 'communication', description: 'Automated overdue payment reminders', sortOrder: 2 },
  { code: 'sms_notifications', name: 'SMS Notifications', module: 'communication', description: 'Send invoices and reminders via SMS', sortOrder: 3 },
  { code: 'whatsapp_notifications', name: 'WhatsApp Notifications', module: 'communication', description: 'Send invoices and receipts via WhatsApp', sortOrder: 4 },

  // Advanced
  { code: 'multi_currency', name: 'Multi-Currency', module: 'advanced', description: 'Invoice in BTN, INR, USD', sortOrder: 1 },
  { code: 'custom_fields', name: 'Custom Fields', module: 'advanced', description: 'Add custom fields to invoices and products', sortOrder: 2 },
  { code: 'api_access', name: 'API Access', module: 'advanced', description: 'REST API for integrations', sortOrder: 3 },
  { code: 'data_export', name: 'Data Export', module: 'advanced', description: 'Export data in CSV/Excel format', sortOrder: 4 },
  { code: 'custom_templates', name: 'Custom Templates', module: 'advanced', description: 'Customize invoice PDF, email, and SMS templates', sortOrder: 5 },
];

const DEFAULT_PLANS = [
  {
    name: 'Free',
    description: 'For small businesses getting started',
    isDefault: true,
    sortOrder: 1,
    maxUsers: 2,
    maxInvoicesPerMonth: 10,
    maxProducts: 50,
    maxCustomers: 20,
    features: ['invoices', 'cash_sales', 'payments', 'supplier_bills', 'gst_reports', 'data_export'],
  },
  {
    name: 'Starter',
    description: 'For growing businesses',
    sortOrder: 2,
    maxUsers: 5,
    maxInvoicesPerMonth: 100,
    maxProducts: 500,
    maxCustomers: 200,
    monthlyPrice: '499',
    yearlyPrice: '4990',
    features: ['invoices', 'cash_sales', 'quotations', 'credit_notes', 'payments', 'advances', 'supplier_bills', 'debit_notes', 'inventory', 'gst_returns', 'gst_reports', 'email_invoices', 'data_export'],
  },
  {
    name: 'Professional',
    description: 'For established businesses needing full features',
    sortOrder: 3,
    maxUsers: 15,
    maxInvoicesPerMonth: null,
    maxProducts: null,
    maxCustomers: null,
    monthlyPrice: '999',
    yearlyPrice: '9990',
    features: ['invoices', 'cash_sales', 'quotations', 'credit_notes', 'contracts', 'payments', 'advances', 'supplier_bills', 'debit_notes', 'inventory', 'product_variants', 'gst_returns', 'period_lock', 'gst_reports', 'email_invoices', 'payment_reminders', 'multi_currency', 'data_export', 'custom_templates'],
  },
  {
    name: 'Enterprise',
    description: 'Unlimited everything with premium support',
    sortOrder: 4,
    maxUsers: null,
    maxInvoicesPerMonth: null,
    maxProducts: null,
    maxCustomers: null,
    monthlyPrice: '2499',
    yearlyPrice: '24990',
    features: 'all',
  },
];

export async function POST() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Seed features
  const seededFeatures: Record<string, string> = {};
  for (const f of DEFAULT_FEATURES) {
    const [existing] = await db.select().from(features).where(eq(features.code, f.code)).limit(1);
    if (existing) {
      seededFeatures[f.code] = existing.id;
    } else {
      const [created] = await db.insert(features).values(f).returning();
      seededFeatures[f.code] = created.id;
    }
  }

  // Seed plans
  for (const p of DEFAULT_PLANS) {
    const { features: planFeatureCodes, ...planData } = p;
    const [existing] = await db.select().from(plans).where(eq(plans.name, planData.name)).limit(1);

    let planId: string;
    if (existing) {
      planId = existing.id;
    } else {
      const [created] = await db.insert(plans).values({
        name: planData.name,
        description: planData.description,
        isDefault: planData.isDefault || false,
        sortOrder: planData.sortOrder,
        maxUsers: planData.maxUsers ?? null,
        maxInvoicesPerMonth: planData.maxInvoicesPerMonth ?? null,
        maxProducts: planData.maxProducts ?? null,
        maxCustomers: planData.maxCustomers ?? null,
        monthlyPrice: (planData as any).monthlyPrice || '0',
        yearlyPrice: (planData as any).yearlyPrice || '0',
      }).returning();
      planId = created.id;
    }

    // Assign features
    await db.delete(planFeatures).where(eq(planFeatures.planId, planId));
    const featureIdsToAssign = planFeatureCodes === 'all'
      ? Object.values(seededFeatures)
      : (planFeatureCodes as string[]).filter(c => seededFeatures[c]).map(c => seededFeatures[c]);

    if (featureIdsToAssign.length) {
      await db.insert(planFeatures).values(
        featureIdsToAssign.map(fId => ({ planId, featureId: fId }))
      );
    }
  }

  return NextResponse.json({ success: true, features: Object.keys(seededFeatures).length, plans: DEFAULT_PLANS.length });
}
