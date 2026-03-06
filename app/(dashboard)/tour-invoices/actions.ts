'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  tourInvoices,
  tourInvoiceItems,
  tourInvoiceGuests,
  tourInvoicePayments,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getNextTourInvoiceNumber } from '@/lib/db/tour-invoice-queries';
import { revalidatePath } from 'next/cache';
import { calcSDFMixed } from '@/lib/tour-invoice/sdf';

const tourInvoiceItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  quantity: z.string(),
  unit: z.string().optional(),
  unitPrice: z.string(),
  pricingBasis: z.enum(['per_unit', 'per_pax', 'per_night', 'per_pax_per_night']),
  numberOfDays: z.number().nullable().optional(),
  numberOfPersons: z.number().nullable().optional(),
  lineTotal: z.string(),
  discountPercent: z.string().optional(),
  discountAmount: z.string().optional(),
  taxRate: z.string(),
  taxAmount: z.string(),
  isTaxExempt: z.boolean(),
  itemTotal: z.string(),
  sortOrder: z.number(),
});

const tourInvoiceGuestSchema = z.object({
  guestName: z.string().min(1),
  nationality: z.string().min(1),
  passportNumber: z.string().optional(),
  visaNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  specialRequirements: z.string().optional(),
});

const createTourInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  tourName: z.string().min(1),
  tourType: z.string().min(1),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  numberOfNights: z.number().nullable().optional(),
  numberOfGuests: z.number().min(1),
  guestNationality: z.string().min(1),
  tourGuide: z.string().optional(),
  currency: z.string().min(1),
  dueDate: z.string().optional(),

  sdfPerPersonPerNight: z.string(),
  sdfTotal: z.string(),

  subtotal: z.string(),
  totalTax: z.string(),
  totalDiscount: z.string(),
  grandTotal: z.string(),
  amountDue: z.string(),

  items: z.array(tourInvoiceItemSchema),
  guests: z.array(tourInvoiceGuestSchema),

  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),

  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export const createTourInvoice = validatedActionWithUser(
  createTourInvoiceSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const invoiceNumber = await getNextTourInvoiceNumber(team.id);

    const [invoice] = await db
      .insert(tourInvoices)
      .values({
        teamId: team.id,
        customerId: data.customerId,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        tourName: data.tourName,
        tourType: data.tourType,
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        numberOfNights: data.numberOfNights ?? null,
        numberOfGuests: data.numberOfGuests,
        guestNationality: data.guestNationality,
        tourGuide: data.tourGuide || null,
        currency: data.currency,
        sdfPerPersonPerNight: data.sdfPerPersonPerNight,
        sdfTotal: data.sdfTotal,
        subtotal: data.subtotal,
        totalTax: data.totalTax,
        totalDiscount: data.totalDiscount,
        grandTotal: data.grandTotal,
        amountPaid: '0',
        amountDue: data.amountDue,
        status: 'draft',
        paymentStatus: 'unpaid',
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        customerNotes: data.customerNotes || null,
        termsAndConditions: data.termsAndConditions || null,
        createdBy: user.id,
      })
      .returning();

    if (data.items.length > 0) {
      await db.insert(tourInvoiceItems).values(
        data.items.map((item) => ({
          tourInvoiceId: invoice.id,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          unitPrice: item.unitPrice,
          pricingBasis: item.pricingBasis,
          numberOfDays: item.numberOfDays ?? null,
          numberOfPersons: item.numberOfPersons ?? null,
          lineTotal: item.lineTotal,
          discountPercent: item.discountPercent || '0',
          discountAmount: item.discountAmount || '0',
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          isTaxExempt: item.isTaxExempt,
          itemTotal: item.itemTotal,
          sortOrder: item.sortOrder,
        }))
      );
    }

    if (data.guests.length > 0) {
      await db.insert(tourInvoiceGuests).values(
        data.guests.map((guest, i) => ({
          tourInvoiceId: invoice.id,
          guestName: guest.guestName,
          nationality: guest.nationality,
          passportNumber: guest.passportNumber || null,
          visaNumber: guest.visaNumber || null,
          dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
          gender: guest.gender || null,
          email: guest.email || null,
          phone: guest.phone || null,
          specialRequirements: guest.specialRequirements || null,
          sortOrder: i,
        }))
      );
    }

    revalidatePath('/tour-invoices');
    return { success: 'Tour invoice created', invoiceId: invoice.id };
  }
);

const updateTourInvoiceSchema = createTourInvoiceSchema.extend({
  id: z.string().uuid(),
});

export const updateTourInvoice = validatedActionWithUser(
  updateTourInvoiceSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    // Check if locked
    const [existing] = await db
      .select({ isLocked: tourInvoices.isLocked, status: tourInvoices.status })
      .from(tourInvoices)
      .where(and(eq(tourInvoices.id, data.id), eq(tourInvoices.teamId, team.id)))
      .limit(1);

    if (!existing) return { error: 'Tour invoice not found' };
    if (existing.isLocked) return { error: 'Invoice is locked and cannot be edited' };

    await db
      .update(tourInvoices)
      .set({
        customerId: data.customerId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        tourName: data.tourName,
        tourType: data.tourType,
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        numberOfNights: data.numberOfNights ?? null,
        numberOfGuests: data.numberOfGuests,
        guestNationality: data.guestNationality,
        tourGuide: data.tourGuide || null,
        currency: data.currency,
        sdfPerPersonPerNight: data.sdfPerPersonPerNight,
        sdfTotal: data.sdfTotal,
        subtotal: data.subtotal,
        totalTax: data.totalTax,
        totalDiscount: data.totalDiscount,
        grandTotal: data.grandTotal,
        amountDue: data.amountDue,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        customerNotes: data.customerNotes || null,
        termsAndConditions: data.termsAndConditions || null,
        updatedAt: new Date(),
      })
      .where(eq(tourInvoices.id, data.id));

    // Replace items
    await db.delete(tourInvoiceItems).where(eq(tourInvoiceItems.tourInvoiceId, data.id));
    if (data.items.length > 0) {
      await db.insert(tourInvoiceItems).values(
        data.items.map((item) => ({
          tourInvoiceId: data.id,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          unitPrice: item.unitPrice,
          pricingBasis: item.pricingBasis,
          numberOfDays: item.numberOfDays ?? null,
          numberOfPersons: item.numberOfPersons ?? null,
          lineTotal: item.lineTotal,
          discountPercent: item.discountPercent || '0',
          discountAmount: item.discountAmount || '0',
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          isTaxExempt: item.isTaxExempt,
          itemTotal: item.itemTotal,
          sortOrder: item.sortOrder,
        }))
      );
    }

    // Replace guests
    await db.delete(tourInvoiceGuests).where(eq(tourInvoiceGuests.tourInvoiceId, data.id));
    if (data.guests.length > 0) {
      await db.insert(tourInvoiceGuests).values(
        data.guests.map((guest, i) => ({
          tourInvoiceId: data.id,
          guestName: guest.guestName,
          nationality: guest.nationality,
          passportNumber: guest.passportNumber || null,
          visaNumber: guest.visaNumber || null,
          dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
          gender: guest.gender || null,
          email: guest.email || null,
          phone: guest.phone || null,
          specialRequirements: guest.specialRequirements || null,
          sortOrder: i,
        }))
      );
    }

    revalidatePath('/tour-invoices');
    revalidatePath(`/tour-invoices/${data.id}`);
    return { success: 'Tour invoice updated' };
  }
);

const deleteTourInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const deleteTourInvoice = validatedActionWithUser(
  deleteTourInvoiceSchema,
  async (data, _formData, _user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const [existing] = await db
      .select({ status: tourInvoices.status })
      .from(tourInvoices)
      .where(and(eq(tourInvoices.id, data.id), eq(tourInvoices.teamId, team.id)))
      .limit(1);

    if (!existing) return { error: 'Tour invoice not found' };
    if (existing.status !== 'draft') return { error: 'Only draft invoices can be deleted' };

    await db.delete(tourInvoices).where(eq(tourInvoices.id, data.id));

    revalidatePath('/tour-invoices');
    return { success: 'Tour invoice deleted' };
  }
);

const sendTourInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const sendTourInvoice = validatedActionWithUser(
  sendTourInvoiceSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    // Fetch full invoice with details
    const { getTourInvoice } = await import('@/lib/db/tour-invoice-queries');
    const invoice = await getTourInvoice(data.id);
    if (!invoice) return { error: 'Tour invoice not found' };

    // Validate customer email
    const customerEmail = invoice.customer?.email;
    if (!customerEmail) {
      return { error: 'Customer email not found. Please add an email to the customer first.' };
    }

    const { sendEmail, isValidEmail } = await import('@/lib/email/utils');
    if (!isValidEmail(customerEmail)) {
      return { error: 'Invalid customer email address' };
    }

    const { TourInvoiceEmail } = await import('@/lib/email/templates/tour-invoice-email');
    const { generateTourInvoicePDF, getTourInvoicePDFFilename } = await import('@/lib/pdf/generator');
    const { getActiveBankAccounts } = await import('@/lib/bank-accounts/queries');
    const QRCode = (await import('qrcode')).default;

    const bankAccounts = await getActiveBankAccounts().catch(() => []);

    const formatDate = (date: Date | null | undefined) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount: string) =>
      `${invoice.currency} ${parseFloat(amount).toFixed(2)}`;

    // Generate category totals for email
    const categoryTotals: Record<string, number> = {};
    const CATEGORY_LABELS: Record<string, string> = {
      accommodation: 'Accommodation', domestic_flight: 'Domestic Flights',
      international_flight: 'International Flights', transport: 'Transport',
      guide: 'Guide', meals: 'Meals', permits: 'Permits & Entry Fees',
      activities: 'Activities', visa: 'Visa', miscellaneous: 'Miscellaneous',
    };
    invoice.items.forEach((item: any) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + parseFloat(item.itemTotal);
    });

    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/view/tour-invoice/${invoice.publicId}`
      : undefined;

    // Generate PDF attachment
    let qrCodeDataUrl: string | null = null;
    if (viewUrl) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(viewUrl, {
          width: 150, margin: 1,
          color: { dark: '#1f2937', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
      } catch { /* ignore */ }
    }

    const displayName = (team as any).businessName || team.name;

    const pdfData = {
      businessName: displayName,
      logoUrl: (team as any).logoUrl,
      tpn: (team as any).tpn,
      gstNumber: (team as any).gstNumber,
      licenseNumber: (team as any).licenseNumber,
      address: (team as any).address,
      city: (team as any).city,
      dzongkhag: (team as any).dzongkhag,
      bankAccounts,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency,
      customer: {
        name: invoice.customer?.name || 'N/A',
        email: invoice.customer?.email,
        phone: invoice.customer?.phone,
        address: invoice.customer?.address,
        tpn: invoice.customer?.tpn,
      },
      tourName: invoice.tourName,
      tourType: invoice.tourType,
      arrivalDate: invoice.arrivalDate,
      departureDate: invoice.departureDate,
      numberOfNights: invoice.numberOfNights,
      numberOfGuests: invoice.numberOfGuests,
      guestNationality: invoice.guestNationality,
      tourGuide: invoice.tourGuide,
      guests: invoice.guests.map((g: any) => ({
        guestName: g.guestName,
        nationality: g.nationality,
        passportNumber: g.passportNumber,
        visaNumber: g.visaNumber,
      })),
      items: invoice.items.map((item: any) => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount || '0',
        isTaxExempt: item.isTaxExempt,
        itemTotal: item.itemTotal || '0',
      })),
      sdfPerPersonPerNight: invoice.sdfPerPersonPerNight,
      sdfTotal: invoice.sdfTotal,
      sdfBreakdown: invoice.guests.length > 0
        ? calcSDFMixed(
            invoice.guests.map((g: any) => ({ nationality: g.nationality })),
            invoice.numberOfNights
          ).breakdown
        : undefined,
      inclusions: (invoice.inclusions as string[]) || [],
      exclusions: (invoice.exclusions as string[]) || [],
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      paymentTerms: invoice.paymentTerms,
      customerNotes: invoice.customerNotes,
      termsAndConditions: invoice.termsAndConditions || (team as any).invoiceTerms,
      qrCodeDataUrl,
    };

    const accentColor = (team as any).invoiceAccentColor || '#1f2937';
    const pdfStream = await generateTourInvoicePDF(pdfData, accentColor);
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Send email
    const result = await sendEmail({
      to: customerEmail,
      subject: `Tour Invoice ${invoice.invoiceNumber} from ${displayName}`,
      template: TourInvoiceEmail({
        businessName: displayName,
        customerName: invoice.customer?.name || 'Valued Customer',
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: formatDate(invoice.invoiceDate),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : 'Upon receipt',
        tourName: invoice.tourName,
        arrivalDate: formatDate(invoice.arrivalDate),
        departureDate: formatDate(invoice.departureDate),
        numberOfNights: invoice.numberOfNights ?? 0,
        numberOfGuests: invoice.numberOfGuests,
        guestNationality: invoice.guestNationality,
        currency: invoice.currency,
        categoryTotals: Object.entries(categoryTotals).map(([cat, total]) => ({
          category: CATEGORY_LABELS[cat] || cat,
          total: formatCurrency(total.toFixed(2)),
        })),
        sdfTotal: parseFloat(invoice.sdfTotal).toFixed(2),
        grandTotal: formatCurrency(invoice.grandTotal),
        viewUrl,
      }),
      attachments: [{
        filename: getTourInvoicePDFFilename(invoice.invoiceNumber),
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    if (!result.success) {
      return { error: result.error || 'Failed to send email' };
    }

    // Update status
    await db
      .update(tourInvoices)
      .set({
        status: 'sent',
        sentAt: new Date(),
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(tourInvoices.id, data.id), eq(tourInvoices.teamId, team.id)));

    revalidatePath('/tour-invoices');
    revalidatePath(`/tour-invoices/${data.id}`);
    return { success: 'Tour invoice sent successfully' };
  }
);

const cancelTourInvoiceSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().optional(),
});

export const cancelTourInvoice = validatedActionWithUser(
  cancelTourInvoiceSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    await db
      .update(tourInvoices)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: data.reason || null,
        cancelledById: user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(tourInvoices.id, data.id), eq(tourInvoices.teamId, team.id)));

    revalidatePath('/tour-invoices');
    revalidatePath(`/tour-invoices/${data.id}`);
    return { success: 'Tour invoice cancelled' };
  }
);

// ============================================================
// DUPLICATE TOUR INVOICE
// ============================================================

const duplicateTourInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const duplicateTourInvoice = validatedActionWithUser(
  duplicateTourInvoiceSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const { getTourInvoice } = await import('@/lib/db/tour-invoice-queries');
    const source = await getTourInvoice(data.id);
    if (!source) return { error: 'Tour invoice not found' };

    const invoiceNumber = await getNextTourInvoiceNumber(team.id);

    const [newInvoice] = await db
      .insert(tourInvoices)
      .values({
        teamId: team.id,
        customerId: source.customerId,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: null,
        tourName: source.tourName,
        tourType: source.tourType,
        arrivalDate: source.arrivalDate,
        departureDate: source.departureDate,
        numberOfNights: source.numberOfNights,
        numberOfGuests: source.numberOfGuests,
        guestNationality: source.guestNationality,
        tourGuide: source.tourGuide,
        currency: source.currency,
        sdfPerPersonPerNight: source.sdfPerPersonPerNight,
        sdfTotal: source.sdfTotal,
        subtotal: source.subtotal,
        totalTax: source.totalTax,
        totalDiscount: source.totalDiscount,
        grandTotal: source.grandTotal,
        amountPaid: '0',
        amountDue: source.grandTotal,
        status: 'draft',
        paymentStatus: 'unpaid',
        inclusions: source.inclusions,
        exclusions: source.exclusions,
        paymentTerms: source.paymentTerms,
        notes: source.notes,
        customerNotes: source.customerNotes,
        termsAndConditions: source.termsAndConditions,
        createdBy: user.id,
      })
      .returning();

    // Copy items
    if (source.items.length > 0) {
      await db.insert(tourInvoiceItems).values(
        source.items.map((item) => ({
          tourInvoiceId: newInvoice.id,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          pricingBasis: item.pricingBasis,
          numberOfDays: item.numberOfDays,
          numberOfPersons: item.numberOfPersons,
          lineTotal: item.lineTotal,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          isTaxExempt: item.isTaxExempt,
          itemTotal: item.itemTotal,
          sortOrder: item.sortOrder,
        }))
      );
    }

    // Copy guests
    if (source.guests.length > 0) {
      await db.insert(tourInvoiceGuests).values(
        source.guests.map((guest, i) => ({
          tourInvoiceId: newInvoice.id,
          guestName: guest.guestName,
          nationality: guest.nationality,
          passportNumber: guest.passportNumber,
          visaNumber: guest.visaNumber,
          dateOfBirth: guest.dateOfBirth,
          gender: guest.gender,
          email: guest.email,
          phone: guest.phone,
          specialRequirements: guest.specialRequirements,
          sortOrder: i,
        }))
      );
    }

    revalidatePath('/tour-invoices');
    return { success: 'Tour invoice duplicated', invoiceId: newInvoice.id };
  }
);

// ============================================================
// SEND TOUR INVOICE REMINDER
// ============================================================

const sendTourInvoiceReminderSchema = z.object({
  id: z.string().uuid(),
});

export const sendTourInvoiceReminder = validatedActionWithUser(
  sendTourInvoiceReminderSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const { getTourInvoice } = await import('@/lib/db/tour-invoice-queries');
    const invoice = await getTourInvoice(data.id);
    if (!invoice) return { error: 'Tour invoice not found' };

    if (invoice.paymentStatus === 'paid') return { error: 'Invoice is already paid' };

    const customerEmail = invoice.customer?.email;
    if (!customerEmail) return { error: 'Customer email not found' };

    const { sendEmail, isValidEmail } = await import('@/lib/email/utils');
    if (!isValidEmail(customerEmail)) return { error: 'Invalid customer email address' };

    // Calculate days overdue
    let daysOverdue = 0;
    if (invoice.dueDate) {
      const diffTime = new Date().getTime() - new Date(invoice.dueDate).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysOverdue = diffDays > 0 ? diffDays : 0;
    }

    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/view/tour-invoice/${invoice.publicId}`
      : undefined;

    const displayName = (team as any).businessName || team.name;
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const { TourInvoiceReminderEmail } = await import('@/lib/email/templates/tour-invoice-reminder-email');

    const result = await sendEmail({
      to: customerEmail,
      subject: daysOverdue > 0
        ? `Payment Overdue: Tour Invoice ${invoice.invoiceNumber}`
        : `Payment Reminder: Tour Invoice ${invoice.invoiceNumber}`,
      template: TourInvoiceReminderEmail({
        businessName: displayName,
        customerName: invoice.customer?.name || 'Valued Customer',
        invoiceNumber: invoice.invoiceNumber,
        tourName: invoice.tourName,
        amountDue: `${invoice.currency} ${parseFloat(invoice.amountDue).toFixed(2)}`,
        currency: invoice.currency,
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : 'Upon receipt',
        daysOverdue,
        viewUrl,
      }),
    });

    if (!result.success) return { error: result.error || 'Failed to send reminder' };

    // Update lastReminderSentAt
    await db
      .update(tourInvoices)
      .set({ lastReminderSentAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tourInvoices.id, data.id), eq(tourInvoices.teamId, team.id)));

    revalidatePath('/tour-invoices');
    revalidatePath(`/tour-invoices/${data.id}`);
    return { success: 'Payment reminder sent successfully' };
  }
);

const recordTourInvoicePaymentSchema = z.object({
  tourInvoiceId: z.string().uuid(),
  amount: z.string().min(1),
  currency: z.string().min(1),
  paymentDate: z.string().min(1),
  paymentMethod: z.string().min(1),
  transactionId: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

export const recordTourInvoicePayment = validatedActionWithUser(
  recordTourInvoicePaymentSchema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    // Verify invoice belongs to team
    const [invoice] = await db
      .select({
        amountPaid: tourInvoices.amountPaid,
        grandTotal: tourInvoices.grandTotal,
        teamId: tourInvoices.teamId,
      })
      .from(tourInvoices)
      .where(and(eq(tourInvoices.id, data.tourInvoiceId), eq(tourInvoices.teamId, team.id)))
      .limit(1);

    if (!invoice) return { error: 'Tour invoice not found' };

    // Insert payment
    await db.insert(tourInvoicePayments).values({
      teamId: team.id,
      tourInvoiceId: data.tourInvoiceId,
      amount: data.amount,
      currency: data.currency,
      paymentDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId || null,
      bankName: data.bankName || null,
      notes: data.notes || null,
      createdBy: user.id,
    });

    // Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amountPaid) + parseFloat(data.amount);
    const newAmountDue = parseFloat(invoice.grandTotal) - newAmountPaid;
    const paymentStatus = newAmountDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
    const status = paymentStatus === 'paid' ? 'paid' : paymentStatus === 'partial' ? 'partial' : undefined;

    const updateData: Record<string, any> = {
      amountPaid: newAmountPaid.toFixed(2),
      amountDue: Math.max(0, newAmountDue).toFixed(2),
      paymentStatus,
      updatedAt: new Date(),
    };
    if (status) updateData.status = status;

    await db
      .update(tourInvoices)
      .set(updateData)
      .where(eq(tourInvoices.id, data.tourInvoiceId));

    revalidatePath('/tour-invoices');
    revalidatePath(`/tour-invoices/${data.tourInvoiceId}`);
    return { success: 'Payment recorded successfully' };
  }
);
