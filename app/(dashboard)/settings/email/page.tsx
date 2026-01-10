'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';
import { sendTestEmailAction } from '@/lib/email/test-email-action';

export default function EmailSettingsPage() {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleSendTest = async () => {
    if (!testEmail) {
      setResult({ success: false, error: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await sendTestEmailAction(testEmail);
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  // Get email configuration status from environment
  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true';
  const hasSmtpConfig = !!(
    process.env.NEXT_PUBLIC_SMTP_HOST &&
    process.env.NEXT_PUBLIC_SMTP_PORT &&
    process.env.NEXT_PUBLIC_EMAIL_FROM
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Email Settings
          </h1>
          <p className="text-sm text-gray-500">
            Configure email delivery for invoices, receipts, and reminders
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Email Configuration Status</CardTitle>
                  <CardDescription>
                    Current email delivery status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                {emailEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Email Delivery: {emailEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {emailEnabled
                      ? 'Email delivery is active. Invoices and receipts will be sent to customers.'
                      : 'Email delivery is disabled. Configure SMTP settings to enable email.'}
                  </p>
                </div>
              </div>

              {emailEnabled && (
                <>
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    {hasSmtpConfig ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        SMTP Configuration: {hasSmtpConfig ? 'Complete' : 'Incomplete'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {hasSmtpConfig
                          ? 'SMTP server settings are configured in environment variables.'
                          : 'Some SMTP settings are missing. Check your .env file.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-gray-700">Current Configuration:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">SMTP Host:</span>
                        <span className="ml-2 font-mono">
                          {process.env.NEXT_PUBLIC_SMTP_HOST || 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">SMTP Port:</span>
                        <span className="ml-2 font-mono">
                          {process.env.NEXT_PUBLIC_SMTP_PORT || 'Not set'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">From Address:</span>
                        <span className="ml-2 font-mono">
                          {process.env.NEXT_PUBLIC_EMAIL_FROM || 'Not set'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">From Name:</span>
                        <span className="ml-2">
                          {process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'EasyGST'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Test Email Card */}
          <Card>
            <CardHeader>
              <CardTitle>Test Email Delivery</CardTitle>
              <CardDescription>
                Send a test email to verify your SMTP configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Email Address</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sending || !emailEnabled}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>

              {result && (
                <div
                  className={`flex items-start gap-2 p-3 border rounded-lg ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? 'Test email sent successfully!' : 'Failed to send email'}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-700 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              )}

              {!emailEnabled && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Email delivery is disabled. Enable it by setting EMAIL_ENABLED=true in your
                    environment variables and configuring SMTP settings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Add these environment variables to your .env file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@easygst.bt
EMAIL_FROM_NAME=EasyGST
SMTP_TLS_REJECT_UNAUTHORIZED=true

# Optional: App URL for email links
NEXT_PUBLIC_APP_URL=https://yourdomain.com`}</pre>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Supported Email Providers:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Gmail (smtp.gmail.com:587)</li>
                  <li>Outlook (smtp-mail.outlook.com:587)</li>
                  <li>SendGrid (smtp.sendgrid.net:587)</li>
                  <li>AWS SES (email-smtp.region.amazonaws.com:587)</li>
                  <li>Any SMTP-compatible email service</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Email Features */}
          <Card>
            <CardHeader>
              <CardTitle>Email Features</CardTitle>
              <CardDescription>
                Automatic email notifications available in EasyGST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Invoice Emails</p>
                    <p className="text-sm text-gray-600">
                      Send invoices to customers when marking them as sent
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Payment Receipts</p>
                    <p className="text-sm text-gray-600">
                      Automatically send receipts when payments are recorded
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Payment Reminders</p>
                    <p className="text-sm text-gray-600">
                      Send reminder emails for unpaid invoices with one click
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
