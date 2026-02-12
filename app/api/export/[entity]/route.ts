import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { toCSV, EXPORT_COLUMNS, type ExportEntity } from '@/lib/export/csv';
import { db } from '@/lib/db/drizzle';
import {
  invoices,
  customers,
  suppliers,
  supplierBills,
  customerPayments,
  products,
  productCategories,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const entity = params.entity as string;

    if (!EXPORT_COLUMNS[entity as ExportEntity]) {
      return NextResponse.json(
        { error: `Invalid entity: ${entity}. Valid: ${Object.keys(EXPORT_COLUMNS).join(', ')}` },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>[] = [];
    const columns = EXPORT_COLUMNS[entity as ExportEntity];

    switch (entity) {
      case 'invoices': {
        const rows = await db
          .select({
            invoiceNumber: invoices.invoiceNumber,
            invoiceDate: invoices.invoiceDate,
            dueDate: invoices.dueDate,
            customerName: customers.name,
            customerTpn: customers.tpn,
            status: invoices.status,
            paymentStatus: invoices.paymentStatus,
            currency: invoices.currency,
            subtotal: invoices.subtotal,
            totalTax: invoices.totalTax,
            totalDiscount: invoices.totalDiscount,
            totalAmount: invoices.totalAmount,
            amountPaid: invoices.amountPaid,
            amountDue: invoices.amountDue,
          })
          .from(invoices)
          .leftJoin(customers, eq(invoices.customerId, customers.id))
          .where(eq(invoices.teamId, team.id))
          .orderBy(invoices.invoiceDate);
        data = rows;
        break;
      }
      case 'customers': {
        const rows = await db
          .select()
          .from(customers)
          .where(eq(customers.teamId, team.id))
          .orderBy(customers.name);
        data = rows;
        break;
      }
      case 'suppliers': {
        const rows = await db
          .select()
          .from(suppliers)
          .where(eq(suppliers.teamId, team.id))
          .orderBy(suppliers.name);
        data = rows;
        break;
      }
      case 'bills': {
        const rows = await db
          .select({
            billNumber: supplierBills.billNumber,
            billDate: supplierBills.billDate,
            dueDate: supplierBills.dueDate,
            supplierName: suppliers.name,
            supplierTpn: suppliers.tpn,
            status: supplierBills.status,
            paymentStatus: supplierBills.paymentStatus,
            currency: supplierBills.currency,
            subtotal: supplierBills.subtotal,
            totalTax: supplierBills.totalTax,
            totalDiscount: supplierBills.totalDiscount,
            totalAmount: supplierBills.totalAmount,
            amountPaid: supplierBills.amountPaid,
            amountDue: supplierBills.amountDue,
          })
          .from(supplierBills)
          .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
          .where(eq(supplierBills.teamId, team.id))
          .orderBy(supplierBills.billDate);
        data = rows;
        break;
      }
      case 'payments': {
        const rows = await db
          .select({
            receiptNumber: customerPayments.receiptNumber,
            paymentDate: customerPayments.paymentDate,
            customerName: customers.name,
            amount: customerPayments.amount,
            currency: customerPayments.currency,
            paymentMethod: customerPayments.paymentMethod,
            transactionId: customerPayments.transactionId,
            allocatedAmount: customerPayments.allocatedAmount,
            unallocatedAmount: customerPayments.unallocatedAmount,
          })
          .from(customerPayments)
          .leftJoin(customers, eq(customerPayments.customerId, customers.id))
          .where(eq(customerPayments.teamId, team.id))
          .orderBy(customerPayments.paymentDate);
        data = rows;
        break;
      }
      case 'products': {
        const rows = await db
          .select({
            name: products.name,
            sku: products.sku,
            description: products.description,
            unitPrice: products.unitPrice,
            unit: products.unit,
            defaultTaxRate: products.defaultTaxRate,
            categoryName: productCategories.name,
            isActive: products.isActive,
          })
          .from(products)
          .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
          .where(eq(products.teamId, team.id))
          .orderBy(products.name);
        data = rows;
        break;
      }
    }

    const csv = toCSV(data, columns as unknown as { key: string; header: string }[]);
    const filename = `${entity}-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
});
