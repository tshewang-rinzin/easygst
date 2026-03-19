'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  Users,
  MapPin,
  Plane,
  X,
  AlertTriangle,
  ClipboardPaste,
  Zap,
  Search,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { createTourInvoice, updateTourInvoice } from '../actions';
import { TOUR_CATEGORIES, CATEGORY_MAP, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS } from '@/lib/tour-invoice/category-presets';
import type { PricingBasis } from '@/lib/tour-invoice/category-presets';
import { calcSDF, calcSDFMixed, isSdfExempt } from '@/lib/tour-invoice/sdf';
import { TOUR_TYPES, NATIONALITIES, CURRENCIES } from '@/lib/tour-invoice/types';
import type { TourInvoiceItemFormData, TourInvoiceGuestFormData, TourInvoiceFormData } from '@/lib/tour-invoice/types';

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface TourInvoiceFormProps {
  existingInvoice?: any;
  existingItems?: any[];
  existingGuests?: any[];
  initialCustomer?: Customer | null;
}

export function TourInvoiceForm({ existingInvoice, existingItems, existingGuests, initialCustomer }: TourInvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer search state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  // Add new customer dialog
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerSaving, setNewCustomerSaving] = useState(false);

  // Customer search effect
  useEffect(() => {
    if (customerQuery.length < 2) {
      setCustomerResults([]);
      setCustomerSearchOpen(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(data);
          setCustomerSearchOpen(true);
        }
      } catch (e) {
        console.error('Customer search error:', e);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery('');
    setCustomerSearchOpen(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setNewCustomerSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          customerType: 'business',
        }),
      });
      if (res.ok) {
        const customer = await res.json();
        setSelectedCustomer({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
        setShowNewCustomerDialog(false);
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create customer');
      }
    } catch (e) {
      setError('Failed to create customer');
    } finally {
      setNewCustomerSaving(false);
    }
  };

  // Sync customerId with selectedCustomer
  const customerId = selectedCustomer?.id || '';
  const [tourName, setTourName] = useState(existingInvoice?.tourName || '');
  const [tourType, setTourType] = useState(existingInvoice?.tourType || 'cultural');
  const [arrivalDate, setArrivalDate] = useState(existingInvoice?.arrivalDate ? new Date(existingInvoice.arrivalDate).toISOString().split('T')[0] : '');
  const [departureDate, setDepartureDate] = useState(existingInvoice?.departureDate ? new Date(existingInvoice.departureDate).toISOString().split('T')[0] : '');
  const [numberOfNightsManual, setNumberOfNightsManual] = useState<string>(existingInvoice?.numberOfNights?.toString() || '');
  const [numberOfGuests, setNumberOfGuests] = useState(existingInvoice?.numberOfGuests?.toString() || '1');
  const [guestNationality, setGuestNationality] = useState(existingInvoice?.guestNationality || 'American');
  const [tourGuide, setTourGuide] = useState(existingInvoice?.tourGuide || '');
  const [currency, setCurrency] = useState(existingInvoice?.currency || 'USD');
  const [dueDate, setDueDate] = useState(existingInvoice?.dueDate ? new Date(existingInvoice.dueDate).toISOString().split('T')[0] : '');

  // Notes
  const [paymentTerms, setPaymentTerms] = useState(existingInvoice?.paymentTerms || '');
  const [notes, setNotes] = useState(existingInvoice?.notes || '');
  const [customerNotes, setCustomerNotes] = useState(existingInvoice?.customerNotes || '');
  const [termsAndConditions, setTermsAndConditions] = useState(existingInvoice?.termsAndConditions || '');

  // Items, guests, inclusions, exclusions
  const [items, setItems] = useState<TourInvoiceItemFormData[]>(
    existingItems?.map((item: any) => ({
      id: item.id,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      unitPrice: item.unitPrice,
      pricingBasis: item.pricingBasis as PricingBasis,
      numberOfDays: item.numberOfDays,
      numberOfPersons: item.numberOfPersons,
      lineTotal: item.lineTotal,
      discountPercent: item.discountPercent || '0',
      discountAmount: item.discountAmount || '0',
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      isTaxExempt: item.isTaxExempt,
      itemTotal: item.itemTotal,
      sortOrder: item.sortOrder,
    })) || []
  );

  const [guests, setGuests] = useState<TourInvoiceGuestFormData[]>(
    existingGuests?.map((g: any) => ({
      guestName: g.guestName,
      nationality: g.nationality,
      passportNumber: g.passportNumber || '',
      visaNumber: g.visaNumber || '',
      gender: g.gender || '',
      email: g.email || '',
      phone: g.phone || '',
      specialRequirements: g.specialRequirements || '',
    })) || []
  );

  const [inclusions, setInclusions] = useState<string[]>(
    (existingInvoice?.inclusions as string[]) || [...DEFAULT_INCLUSIONS]
  );
  const [exclusions, setExclusions] = useState<string[]>(
    (existingInvoice?.exclusions as string[]) || [...DEFAULT_EXCLUSIONS]
  );
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showGuests, setShowGuests] = useState(guests.length > 0);

  // Guest UI modes
  const [guestMode, setGuestMode] = useState<'detail' | 'quick' | 'paste'>('detail');
  const [pasteText, setPasteText] = useState('');

  // Quick add fields
  const [quickName, setQuickName] = useState('');
  const [quickNationality, setQuickNationality] = useState('');

  // Compute nights from dates
  const computedNights = useMemo(() => {
    if (arrivalDate && departureDate) {
      const diff = Math.ceil((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : null;
    }
    return null;
  }, [arrivalDate, departureDate]);

  const numberOfNights = computedNights ?? (numberOfNightsManual ? parseInt(numberOfNightsManual) : null);
  const guestsCount = parseInt(numberOfGuests) || 1;

  // SDF calc — use mixed when guests have different nationalities
  const sdfMixed = useMemo(() => {
    if (guests.length > 0) {
      return calcSDFMixed(guests.filter((g) => g.nationality), numberOfNights);
    }
    return null;
  }, [guests, numberOfNights]);

  const sdf = useMemo(() => {
    if (sdfMixed && guests.length > 0) {
      // Derive SDFResult-compatible values from mixed result
      const effectiveRate = sdfMixed.chargeableCount > 0 ? 100 : 0;
      return {
        sdfPerPersonPerNight: effectiveRate,
        sdfTotal: sdfMixed.totalSDF,
        isExempt: sdfMixed.chargeableCount === 0,
      };
    }
    return calcSDF(guestNationality, guestsCount, numberOfNights);
  }, [sdfMixed, guests.length, guestNationality, guestsCount, numberOfNights]);

  // Guest count mismatch warning
  const guestCountMismatch = guests.length > 0 && guests.length !== guestsCount;
  const guestsMissingPassport = guests.filter((g) => g.guestName && !g.passportNumber);

  // Totals
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + parseFloat(item.itemTotal || '0'), 0), [items]);
  const totalTax = useMemo(() => items.reduce((sum, item) => sum + parseFloat(item.taxAmount || '0'), 0), [items]);
  const totalDiscount = useMemo(() => items.reduce((sum, item) => sum + parseFloat(item.discountAmount || '0'), 0), [items]);
  const grandTotal = subtotal + sdf.sdfTotal;
  const amountDue = grandTotal;

  // Category subtotals
  const categorySubtotals = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + parseFloat(item.itemTotal || '0');
    });
    return map;
  }, [items]);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function addItemFromPreset(categoryKey: string, presetIdx: number) {
    const cat = CATEGORY_MAP[categoryKey];
    if (!cat) return;
    const preset = cat.items[presetIdx];
    if (!preset) return;

    const newItem: TourInvoiceItemFormData = {
      category: categoryKey,
      description: preset.description,
      quantity: '1',
      unit: preset.unit,
      unitPrice: '0',
      pricingBasis: preset.defaultPricingBasis,
      numberOfDays: numberOfNights ?? undefined,
      numberOfPersons: guestsCount,
      lineTotal: '0',
      discountPercent: '0',
      discountAmount: '0',
      taxRate: '0',
      taxAmount: '0',
      isTaxExempt: preset.isTaxExempt || false,
      itemTotal: '0',
      sortOrder: items.filter((i) => i.category === categoryKey).length,
    };

    setItems((prev) => [...prev, newItem]);
    setExpandedCategories((prev) => new Set(prev).add(categoryKey));
  }

  function addCustomItem(categoryKey: string) {
    const newItem: TourInvoiceItemFormData = {
      category: categoryKey,
      description: '',
      quantity: '1',
      unit: '',
      unitPrice: '0',
      pricingBasis: 'per_unit',
      numberOfDays: numberOfNights ?? undefined,
      numberOfPersons: guestsCount,
      lineTotal: '0',
      discountPercent: '0',
      discountAmount: '0',
      taxRate: '0',
      taxAmount: '0',
      isTaxExempt: false,
      itemTotal: '0',
      sortOrder: items.filter((i) => i.category === categoryKey).length,
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedCategories((prev) => new Set(prev).add(categoryKey));
  }

  function updateItem(index: number, field: string, value: any) {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalculate
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const lt = qty * price;
      const discPct = parseFloat(item.discountPercent || '0');
      const discAmt = lt * discPct / 100;
      const afterDisc = lt - discAmt;
      const taxAmt = item.isTaxExempt ? 0 : afterDisc * (parseFloat(item.taxRate) || 0) / 100;

      item.lineTotal = lt.toFixed(2);
      item.discountAmount = discAmt.toFixed(2);
      item.taxAmount = taxAmt.toFixed(2);
      item.itemTotal = (afterDisc + taxAmt).toFixed(2);

      updated[index] = item;
      return updated;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addGuest() {
    setGuests((prev) => [...prev, {
      guestName: '',
      nationality: guestNationality,
      passportNumber: '',
      visaNumber: '',
      gender: '',
      email: '',
      phone: '',
      specialRequirements: '',
    }]);
    setShowGuests(true);
  }

  function addQuickGuest() {
    if (!quickName.trim()) return;
    setGuests((prev) => [...prev, {
      guestName: quickName.trim(),
      nationality: quickNationality || guestNationality,
      passportNumber: '',
      visaNumber: '',
      gender: '',
      email: '',
      phone: '',
      specialRequirements: '',
    }]);
    setQuickName('');
    setQuickNationality('');
    setShowGuests(true);
  }

  function handlePasteImport() {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n');
    const newGuests: TourInvoiceGuestFormData[] = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length === 0 || !parts[0].trim()) continue;
      newGuests.push({
        guestName: parts[0].trim(),
        nationality: parts[1]?.trim() || guestNationality,
        passportNumber: parts[2]?.trim() || '',
        visaNumber: '',
        gender: '',
        email: '',
        phone: '',
        specialRequirements: '',
      });
    }
    if (newGuests.length > 0) {
      setGuests((prev) => [...prev, ...newGuests]);
      setPasteText('');
      setGuestMode('detail');
      setShowGuests(true);
    }
  }

  function updateGuest(index: number, field: string, value: string) {
    setGuests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeGuest(index: number) {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(sendAfterSave = false) {
    setError('');
    setIsSubmitting(true);

    try {
      const formData: any = {
        customerId,
        tourName,
        tourType,
        arrivalDate: arrivalDate || undefined,
        departureDate: departureDate || undefined,
        numberOfNights: numberOfNights ?? undefined,
        numberOfGuests: guestsCount,
        guestNationality,
        tourGuide: tourGuide || undefined,
        currency,
        dueDate: dueDate || undefined,
        sdfPerPersonPerNight: sdf.sdfPerPersonPerNight.toFixed(2),
        sdfTotal: sdf.sdfTotal.toFixed(2),
        subtotal: subtotal.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        amountDue: amountDue.toFixed(2),
        items,
        guests,
        inclusions,
        exclusions,
        paymentTerms: paymentTerms || undefined,
        notes: notes || undefined,
        customerNotes: customerNotes || undefined,
        termsAndConditions: termsAndConditions || undefined,
      };

      if (existingInvoice) {
        formData.id = existingInvoice.id;
      }

      const action = existingInvoice ? updateTourInvoice : createTourInvoice;
      const result = await action(formData);

      if (result && 'error' in result && result.error) {
        setError(result.error as string);
        return;
      }

      if (sendAfterSave && result && 'invoiceId' in result) {
        // TODO: Send action in Phase 2
      }

      router.push('/tour-invoices');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      )}

      {/* Section 1: Customer & Tour Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Tour Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label>Customer *</Label>
              {selectedCustomer ? (
                <div className="mt-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                    {(selectedCustomer.email || selectedCustomer.phone) && (
                      <div className="text-sm text-gray-500">
                        {selectedCustomer.email}{selectedCustomer.email && selectedCustomer.phone ? ' • ' : ''}{selectedCustomer.phone}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      className="pl-10"
                      autoComplete="off"
                    />
                  </div>
                  {customerSearchOpen && customerResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-sm text-gray-500">
                            {c.email}{c.email && c.phone ? ' • ' : ''}{c.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {customerSearchOpen && customerQuery.length >= 2 && customerResults.length === 0 && !customerSearchLoading && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">No customers found.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setShowNewCustomerDialog(true); setNewCustomerName(customerQuery); setCustomerSearchOpen(false); }}>
                        <UserPlus className="h-4 w-4 mr-2" /> Add &quot;{customerQuery}&quot; as new customer
                      </Button>
                    </div>
                  )}
                  <div className="mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCustomerDialog(true)} className="text-sm text-gray-500">
                      <UserPlus className="h-4 w-4 mr-1" /> Add new customer
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div>
              <Label>Tour Name *</Label>
              <Input value={tourName} onChange={(e) => setTourName(e.target.value)} placeholder="e.g. Cultural Tour of Western Bhutan" />
            </div>
            <div>
              <Label>Tour Type</Label>
              <select
                value={tourType}
                onChange={(e) => setTourType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                {TOUR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Guest Nationality *</Label>
              <select
                value={guestNationality}
                onChange={(e) => setGuestNationality(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                {NATIONALITIES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Arrival Date</Label>
              <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            </div>
            <div>
              <Label>Departure Date</Label>
              <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </div>
            <div>
              <Label>Number of Nights {computedNights ? '(auto)' : ''}</Label>
              <Input
                type="number"
                value={computedNights?.toString() || numberOfNightsManual}
                onChange={(e) => setNumberOfNightsManual(e.target.value)}
                disabled={!!computedNights}
                placeholder="Enter manually or set dates"
              />
            </div>
            <div>
              <Label>Number of Guests *</Label>
              <Input type="number" min="1" value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value)} />
            </div>
            <div>
              <Label>Tour Guide</Label>
              <Input value={tourGuide} onChange={(e) => setTourGuide(e.target.value)} placeholder="Guide name" />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Guest Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowGuests(!showGuests)}
            >
              <Users className="h-5 w-5" />
              Guest Details
              <Badge variant={guestCountMismatch ? 'destructive' : 'secondary'}>
                {guests.length} / {guestsCount}
              </Badge>
              {showGuests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setGuestMode('quick'); setShowGuests(true); }}>
                <Zap className="mr-1 h-4 w-4" /> Quick Add
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setGuestMode('paste'); setShowGuests(true); }}>
                <ClipboardPaste className="mr-1 h-4 w-4" /> Paste
              </Button>
              <Button variant="outline" size="sm" onClick={addGuest}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Guest
              </Button>
            </div>
          </div>
        </CardHeader>
        {showGuests && (
          <CardContent className="space-y-4">
            {/* Warnings */}
            {guestCountMismatch && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Guest count mismatch: {guests.length} guest{guests.length !== 1 ? 's' : ''} entered but &quot;Number of Guests&quot; is set to {guestsCount}.
                </p>
              </div>
            )}

            {guestsMissingPassport.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  {guestsMissingPassport.length} guest{guestsMissingPassport.length !== 1 ? 's' : ''} missing passport number (recommended for tour documentation).
                </p>
              </div>
            )}

            {/* Quick Add Mode */}
            {guestMode === 'quick' && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Quick Add Mode</span>
                  <Button variant="ghost" size="sm" onClick={() => setGuestMode('detail')}>
                    <X className="h-4 w-4" /> Close
                  </Button>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="Guest name"
                      onKeyDown={(e) => { if (e.key === 'Enter') addQuickGuest(); }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Nationality</Label>
                    <select
                      value={quickNationality || guestNationality}
                      onChange={(e) => setQuickNationality(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {NATIONALITIES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                  <Button onClick={addQuickGuest} size="sm">
                    <PlusCircle className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            )}

            {/* Paste Mode */}
            {guestMode === 'paste' && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Paste Guest Data</span>
                  <Button variant="ghost" size="sm" onClick={() => setGuestMode('detail')}>
                    <X className="h-4 w-4" /> Close
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Paste tab-separated data: Name, Nationality, Passport (one guest per line)
                </p>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"John Smith\tAmerican\tAB123456\nJane Doe\tIndian\tCD789012"}
                  rows={4}
                  className="font-mono text-sm"
                />
                <Button onClick={handlePasteImport} size="sm">
                  <ClipboardPaste className="mr-1 h-4 w-4" /> Import Guests
                </Button>
              </div>
            )}

            {/* Guest Cards */}
            {guests.map((guest, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Guest {i + 1}</span>
                    {guest.nationality && isSdfExempt(guest.nationality) && (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                        SDF Exempt
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGuest(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input value={guest.guestName} onChange={(e) => updateGuest(i, 'guestName', e.target.value)} />
                  </div>
                  <div>
                    <Label>Nationality *</Label>
                    <select
                      value={guest.nationality}
                      onChange={(e) => updateGuest(i, 'nationality', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {NATIONALITIES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Passport #</Label>
                    <Input value={guest.passportNumber || ''} onChange={(e) => updateGuest(i, 'passportNumber', e.target.value)} />
                  </div>
                  <div>
                    <Label>Visa #</Label>
                    <Input value={guest.visaNumber || ''} onChange={(e) => updateGuest(i, 'visaNumber', e.target.value)} />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select
                      value={guest.gender || ''}
                      onChange={(e) => updateGuest(i, 'gender', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={guest.email || ''} onChange={(e) => updateGuest(i, 'email', e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={guest.phone || ''} onChange={(e) => updateGuest(i, 'phone', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Special Requirements</Label>
                    <Input value={guest.specialRequirements || ''} onChange={(e) => updateGuest(i, 'specialRequirements', e.target.value)} placeholder="Dietary, accessibility, etc." />
                  </div>
                </div>
              </div>
            ))}

            {guests.length === 0 && guestMode === 'detail' && (
              <p className="text-sm text-gray-500 text-center py-4">No guests added yet. Click &quot;Add Guest&quot; or use Quick Add / Paste.</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 3: Categorized Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5" /> Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TOUR_CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat.key);
            const isExpanded = expandedCategories.has(cat.key);
            const catTotal = categorySubtotals[cat.key] || 0;

            return (
              <div key={cat.key} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(cat.key)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{cat.label}</span>
                    {catItems.length > 0 && (
                      <Badge variant="secondary">{catItems.length} items</Badge>
                    )}
                  </div>
                  {catTotal > 0 && (
                    <span className="font-medium text-sm">{currency} {catTotal.toFixed(2)}</span>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t p-3 space-y-3">
                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((preset, pi) => (
                        <Button
                          key={pi}
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); addItemFromPreset(cat.key, pi); }}
                        >
                          <PlusCircle className="mr-1 h-3 w-3" /> {preset.description}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); addCustomItem(cat.key); }}
                      >
                        <PlusCircle className="mr-1 h-3 w-3" /> Custom Item
                      </Button>
                    </div>

                    {/* Item rows */}
                    {catItems.map((item) => {
                      const globalIdx = items.indexOf(item);
                      return (
                        <div key={globalIdx} className="grid grid-cols-12 gap-2 items-end border-t pt-3">
                          <div className="col-span-3">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(globalIdx, 'description', e.target.value)}
                              placeholder="Description"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(globalIdx, 'quantity', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={item.unit || ''}
                              onChange={(e) => updateItem(globalIdx, 'unit', e.target.value)}
                              placeholder="unit"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(globalIdx, 'unitPrice', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Basis</Label>
                            <select
                              value={item.pricingBasis}
                              onChange={(e) => updateItem(globalIdx, 'pricingBasis', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="per_unit">Flat</option>
                              <option value="per_pax">Per Pax</option>
                              <option value="per_night">Per Night</option>
                              <option value="per_pax_per_night">Per Pax/Night</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Total</Label>
                            <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium">
                              {currency} {item.itemTotal}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => removeItem(globalIdx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Section 4: Inclusions & Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle>Inclusions & Exclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-green-700 font-medium">✓ Inclusions</Label>
              <div className="mt-2 space-y-1">
                {inclusions.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{item}</span>
                    <button onClick={() => setInclusions((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    placeholder="Add inclusion..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newInclusion.trim()) {
                        setInclusions((prev) => [...prev, newInclusion.trim()]);
                        setNewInclusion('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newInclusion.trim()) {
                        setInclusions((prev) => [...prev, newInclusion.trim()]);
                        setNewInclusion('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-red-700 font-medium">✗ Exclusions</Label>
              <div className="mt-2 space-y-1">
                {exclusions.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{item}</span>
                    <button onClick={() => setExclusions((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    placeholder="Add exclusion..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newExclusion.trim()) {
                        setExclusions((prev) => [...prev, newExclusion.trim()]);
                        setNewExclusion('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newExclusion.trim()) {
                        setExclusions((prev) => [...prev, newExclusion.trim()]);
                        setNewExclusion('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: SDF */}
      <Card>
        <CardHeader>
          <CardTitle>Sustainable Development Fee (SDF)</CardTitle>
        </CardHeader>
        <CardContent>
          {sdf.isExempt && !sdfMixed ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700 font-medium">SDF Exempt</p>
              <p className="text-green-600 text-sm">{guestNationality} nationals are exempt from SDF</p>
            </div>
          ) : sdfMixed && sdfMixed.isMixed ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
              <p className="text-blue-800 font-medium text-sm">SDF Breakdown (Mixed Nationalities)</p>
              {sdfMixed.breakdown.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {b.isExempt ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Exempt</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Chargeable</Badge>
                  )}
                  <span className="text-blue-700">
                    {b.count} × {b.nationality} × {b.nights} night{b.nights !== 1 ? 's' : ''} × USD {b.ratePerNight}
                    {' '}= USD {b.subtotal.toFixed(2)}
                    {b.isExempt && ' (exempt)'}
                  </span>
                </div>
              ))}
              <div className="border-t border-blue-200 pt-2 mt-2">
                <p className="text-blue-900 text-xl font-bold">Total SDF: USD {sdfMixed.totalSDF.toFixed(2)}</p>
                <p className="text-xs text-blue-600">
                  {sdfMixed.chargeableCount} chargeable, {sdfMixed.exemptCount} exempt
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-700 font-medium">
                {guests.length > 0 ? guests.length : guestsCount} guest{(guests.length > 0 ? guests.length : guestsCount) > 1 ? 's' : ''} × {numberOfNights ?? 0} night{(numberOfNights ?? 0) > 1 ? 's' : ''} × USD {sdf.sdfPerPersonPerNight}
              </p>
              <p className="text-blue-900 text-xl font-bold mt-1">USD {sdf.sdfTotal.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md ml-auto">
            {Object.entries(categorySubtotals).map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="text-gray-600">{CATEGORY_MAP[cat]?.label || cat}</span>
                <span>{currency} {total.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{currency} {totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{currency} {totalTax.toFixed(2)}</span>
              </div>
            )}
            {!sdf.isExempt && (
              <div className="flex justify-between text-sm text-blue-700">
                <span>SDF</span>
                <span>USD {sdf.sdfTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>{currency} {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Notes & Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Terms</Label>
              <Textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 50% advance, 50% on arrival" rows={3} />
            </div>
            <div>
              <Label>Customer Notes</Label>
              <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Visible to customer" rows={3} />
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal only" rows={3} />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/tour-invoices')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-800">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Saving...' : existingInvoice ? 'Update' : 'Save as Draft'}
        </Button>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Customer name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="customer@example.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="+975 ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer} disabled={newCustomerSaving || !newCustomerName.trim()}>
              {newCustomerSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create & Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
