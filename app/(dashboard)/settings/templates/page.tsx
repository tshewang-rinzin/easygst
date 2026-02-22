'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FeatureGate } from '@/components/feature-gate';
import {
  FileText,
  Mail,
  MessageSquare,
  Save,
  Check,
  Eye,
  Palette,
  Layout,
  Lock,
} from 'lucide-react';
import useSWR from 'swr';
import { updateTeam } from '@/lib/teams/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ─── Template definitions ────────────────────────────────────────────
const PDF_TEMPLATES = [
  {
    id: 'classic' as const,
    name: 'Classic',
    description: 'Professional dark header bar with formal layout. Traditional business invoice style.',
    colors: ['#1f2937', '#f9fafb', '#ffffff'],
  },
  {
    id: 'modern' as const,
    name: 'Modern',
    description: 'Colorful accent bar on the left side with rounded sections and modern typography.',
    colors: ['#2563eb', '#f9fafb', '#ffffff'],
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Ultra-clean design with lots of whitespace, no borders, and subtle lines.',
    colors: ['#111827', '#f9fafb', '#ffffff'],
  },
];

const EMAIL_TEMPLATES = [
  {
    name: 'Invoice Email',
    description: 'Sent when an invoice is created or shared with a customer. Includes invoice details, amount due, and payment link.',
    structure: ['Business logo & header', 'Invoice number & date', 'Customer greeting', 'Line items summary', 'Total amount due', 'Payment link button', 'Business contact info'],
  },
  {
    name: 'Payment Receipt Email',
    description: 'Sent when a payment is recorded. Confirms the payment amount and remaining balance.',
    structure: ['Business logo & header', 'Receipt number', 'Payment amount & method', 'Invoice reference', 'Remaining balance (if partial)', 'Thank you message'],
  },
  {
    name: 'Payment Reminder Email',
    description: 'Sent for overdue invoices. Reminds the customer of the outstanding amount.',
    structure: ['Business logo & header', 'Reminder notice', 'Invoice number & original due date', 'Days overdue', 'Amount outstanding', 'Payment link button', 'Contact info for queries'],
  },
  {
    name: 'Quotation Email',
    description: 'Sent when a quotation is shared. Includes quoted items and validity period.',
    structure: ['Business logo & header', 'Quotation number & date', 'Customer greeting', 'Quoted items summary', 'Total quoted amount', 'Valid until date', 'Call-to-action button'],
  },
];

const SMS_TEMPLATES = [
  {
    name: 'Invoice Message',
    example: `CloudBhutan\nInvoice #INV-0042\nDear Karma Dorji,\nAmount: BTN 15,000.00\nDue: 15 Mar 2026\nPay: https://pay.example.com/abc\nThank you!`,
  },
  {
    name: 'Receipt Message',
    example: `CloudBhutan\nReceipt #REC-0018\nAmount: BTN 15,000.00\nPaid via: Bank Transfer\nThank you for your payment!`,
  },
  {
    name: 'Payment Reminder',
    example: `CloudBhutan\nPayment Reminder\nDear Karma Dorji,\nInvoice #INV-0042 for BTN 15,000.00 was due on 15 Mar 2026 (5 days overdue).\nPlease arrange payment at your earliest convenience.\nThank you!`,
  },
  {
    name: 'Quotation Message',
    example: `CloudBhutan\nQuotation #QT-0007\nDear Karma Dorji,\nTotal: BTN 25,000.00\nValid until: 30 Mar 2026\nPlease contact us to proceed.\nThank you!`,
  },
];

// ─── Template Preview Placeholder ────────────────────────────────────
function TemplatePreview({ templateId, accentColor }: { templateId: string; accentColor: string }) {
  if (templateId === 'classic') {
    return (
      <div className="w-full h-40 bg-white rounded border border-gray-200 p-3 flex flex-col">
        <div className="h-6 bg-gray-800 rounded-sm mb-2" />
        <div className="flex gap-2 mb-2">
          <div className="flex-1 h-12 bg-gray-100 rounded-sm" />
          <div className="flex-1 h-12 bg-gray-100 rounded-sm" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-200 rounded-sm" />
          <div className="h-3 bg-gray-50 rounded-sm" />
          <div className="h-3 bg-gray-200 rounded-sm" />
        </div>
        <div className="h-4 bg-gray-800 rounded-sm mt-2 w-1/3 ml-auto" />
      </div>
    );
  }

  if (templateId === 'modern') {
    return (
      <div className="w-full h-40 bg-white rounded border border-gray-200 p-3 flex">
        <div className="w-1.5 rounded-full mr-3" style={{ backgroundColor: accentColor }} />
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between mb-2">
            <div className="h-4 w-20 bg-gray-200 rounded-sm" />
            <div className="h-5 w-16 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 h-10 bg-gray-50 rounded-md" />
            <div className="flex-1 h-10 bg-gray-50 rounded-md" />
          </div>
          <div className="h-4 rounded-md mb-1" style={{ backgroundColor: accentColor }} />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-100 rounded-sm" />
            <div className="h-3 bg-gray-50 rounded-sm" />
          </div>
          <div className="h-4 rounded-md mt-1 w-1/3 ml-auto" style={{ backgroundColor: accentColor, opacity: 0.15 }} />
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="w-full h-40 bg-white rounded border border-gray-200 p-4 flex flex-col">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-24 bg-gray-100 rounded-sm" />
        <div className="h-5 w-16 bg-gray-100 rounded-sm" />
      </div>
      <div className="border-b border-gray-100 mb-3" />
      <div className="flex gap-4 mb-3">
        <div className="flex-1 space-y-1">
          <div className="h-2 w-10 bg-gray-100 rounded-sm" />
          <div className="h-3 w-20 bg-gray-200 rounded-sm" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-2 w-10 bg-gray-100 rounded-sm" />
          <div className="h-3 w-20 bg-gray-200 rounded-sm" />
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-sm w-full" />
        <div className="h-2 bg-gray-50 rounded-sm w-full" />
      </div>
      <div className="border-t border-gray-100 mt-2 pt-2">
        <div className="h-3 bg-gray-100 rounded-sm w-20 ml-auto" />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { data: team, mutate } = useSWR('/api/team', fetcher);

  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [accentColor, setAccentColor] = useState('#1f2937');
  const [showLogo, setShowLogo] = useState(true);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [showCustomerNotes, setShowCustomerNotes] = useState(true);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(true);
  const [footerText, setFooterText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (team) {
      setSelectedTemplate(team.invoiceTemplate || 'classic');
      setAccentColor(team.invoiceAccentColor || '#1f2937');
      setShowLogo(team.showLogo ?? true);
      setShowPaymentTerms(team.showPaymentTerms ?? true);
      setShowCustomerNotes(team.showCustomerNotes ?? true);
      setShowTermsAndConditions(team.showTermsAndConditions ?? true);
      setFooterText(team.invoiceFooterText || '');
    }
  }, [team]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await updateTeam({
        invoiceTemplate: selectedTemplate as 'classic' | 'modern' | 'minimal',
        invoiceAccentColor: accentColor,
        showLogo,
        showPaymentTerms,
        showCustomerNotes,
        showTermsAndConditions,
        invoiceFooterText: footerText,
      });
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: 'Template settings saved successfully' });
        mutate();
      } else {
        setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900 flex items-center gap-2">
            <Layout className="h-6 w-6 text-orange-500" />
            Document Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize invoice PDF templates, email templates, and messaging templates
          </p>
        </div>

        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pdf" className="flex items-center gap-2 data-[state=active]:text-orange-600">
              <FileText className="h-4 w-4" />
              Invoice PDF
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:text-orange-600">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2 data-[state=active]:text-orange-600">
              <MessageSquare className="h-4 w-4" />
              SMS / WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Invoice PDF Templates ─── */}
          <TabsContent value="pdf" className="space-y-6">
            {/* Template selector */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">Choose a template style</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PDF_TEMPLATES.map((tmpl) => (
                  <Card
                    key={tmpl.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === tmpl.id
                        ? 'ring-2 ring-orange-500 shadow-md'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                  >
                    <CardContent className="p-4">
                      <TemplatePreview templateId={tmpl.id} accentColor={accentColor} />
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{tmpl.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
                        </div>
                        {selectedTemplate === tmpl.id && (
                          <div className="bg-orange-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Settings — feature gated */}
            <FeatureGate feature="custom_templates" fallback={
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="py-8 text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700 mb-1">Template Customization</h3>
                  <p className="text-sm text-gray-500">Upgrade to Professional or Enterprise to customize accent colors, visibility toggles, and footer text.</p>
                </CardContent>
              </Card>
            }>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-orange-500" />
                  Template Settings
                </CardTitle>
                <CardDescription>Customize your invoice appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Accent color */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Accent Color</Label>
                    <p className="text-xs text-gray-500">Used for headers and highlights in the PDF</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 font-mono">{accentColor}</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Logo</Label>
                      <p className="text-xs text-gray-500">Display your business logo on the invoice</p>
                    </div>
                    <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Payment Terms</Label>
                      <p className="text-xs text-gray-500">Include payment terms section</p>
                    </div>
                    <Switch checked={showPaymentTerms} onCheckedChange={setShowPaymentTerms} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Customer Notes</Label>
                      <p className="text-xs text-gray-500">Display notes to customer on invoice</p>
                    </div>
                    <Switch checked={showCustomerNotes} onCheckedChange={setShowCustomerNotes} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Terms & Conditions</Label>
                      <p className="text-xs text-gray-500">Include T&C in the footer</p>
                    </div>
                    <Switch checked={showTermsAndConditions} onCheckedChange={setShowTermsAndConditions} />
                  </div>
                </div>

                {/* Footer text */}
                <div>
                  <Label className="text-sm font-medium">Invoice Footer Text</Label>
                  <p className="text-xs text-gray-500 mb-2">Custom text displayed at the bottom of every invoice</p>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g. Thank you for your business!"
                  />
                </div>

                {/* Save */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  {message && (
                    <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {message.text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            </FeatureGate>
          </TabsContent>

          {/* ─── Tab 2: Email Templates ─── */}
          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-700">Email Templates</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Custom editing requires Pro plan
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <Card key={tmpl.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500" />
                      {tmpl.name}
                    </CardTitle>
                    <CardDescription className="text-xs">{tmpl.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-3 w-3 mr-2" />
                          Preview Structure
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{tmpl.name} — Structure</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 mt-4">
                          {tmpl.structure.map((section, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                                {i + 1}
                              </div>
                              {section}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          Custom email template editing will be available in a future update.
                        </p>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Tab 3: SMS / WhatsApp Templates ─── */}
          <TabsContent value="sms" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-700">SMS / WhatsApp Templates</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Custom editing requires Pro plan
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SMS_TEMPLATES.map((tmpl) => (
                <Card key={tmpl.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      {tmpl.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-gray-600 bg-gray-50 rounded-md p-3 whitespace-pre-wrap font-mono leading-relaxed">
                      {tmpl.example}
                    </pre>
                    <p className="text-xs text-gray-400 mt-2">
                      Placeholder values shown. Actual data will be filled automatically.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
