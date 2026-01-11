'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Mail, CheckCircle2, XCircle, AlertCircle, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import { updateEmailSettings, sendTestEmailAction } from '@/lib/email/actions';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

type EmailSettings = {
  id?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpSecure?: boolean;
  emailFrom?: string;
  emailFromName?: string;
  emailEnabled?: boolean;
  tlsRejectUnauthorized?: boolean;
  hasPassword?: boolean;
};

export default function EmailSettingsPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateEmailSettings,
    {}
  );

  const { data: settings, mutate } = useSWR<EmailSettings>('/api/email-settings', fetcher);

  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Reset test result when settings update successfully
  useEffect(() => {
    if (state.success) {
      mutate();
    }
  }, [state.success, mutate]);

  const handleSendTest = async () => {
    if (!testEmail) {
      setTestResult({ success: false, error: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append('testEmail', testEmail);
      const response = await sendTestEmailAction({}, formData);
      if (response.error) {
        setTestResult({ success: false, error: response.error });
      } else {
        setTestResult({ success: true });
      }
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  const emailEnabled = settings?.emailEnabled ?? false;
  const hasConfig = !!(settings?.smtpHost && settings?.smtpPort && settings?.emailFrom);

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

        <form action={formAction} className="space-y-6">
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
                      : 'Email delivery is disabled. Configure SMTP settings and enable below.'}
                  </p>
                </div>
              </div>

              {emailEnabled && hasConfig && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      SMTP Configuration: Complete
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      SMTP server settings are configured in the database.
                    </p>
                  </div>
                </div>
              )}

              {emailEnabled && !hasConfig && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      SMTP Configuration: Incomplete
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Please complete the SMTP settings below.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMTP Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure your SMTP server for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost" className="mb-2">
                    SMTP Host <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    placeholder="smtp.gmail.com"
                    defaultValue={settings?.smtpHost || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort" className="mb-2">
                    SMTP Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    placeholder="587"
                    defaultValue={settings?.smtpPort || ''}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser" className="mb-2">
                    SMTP Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtpUser"
                    name="smtpUser"
                    placeholder="your-email@gmail.com"
                    defaultValue={settings?.smtpUser || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword" className="mb-2">
                    SMTP Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      name="smtpPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={settings?.hasPassword ? '••••••••' : 'Enter password'}
                      required={!settings?.hasPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {settings?.hasPassword && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep existing password
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailFrom" className="mb-2">
                    From Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emailFrom"
                    name="emailFrom"
                    type="email"
                    placeholder="noreply@yourdomain.com"
                    defaultValue={settings?.emailFrom || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emailFromName" className="mb-2">
                    From Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emailFromName"
                    name="emailFromName"
                    placeholder="EasyGST"
                    defaultValue={settings?.emailFromName || 'EasyGST'}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smtpSecure"
                    name="smtpSecure"
                    defaultChecked={settings?.smtpSecure ?? false}
                    value="true"
                  />
                  <Label htmlFor="smtpSecure" className="text-sm font-normal cursor-pointer">
                    Use SSL/TLS (enable for port 465)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tlsRejectUnauthorized"
                    name="tlsRejectUnauthorized"
                    defaultChecked={settings?.tlsRejectUnauthorized ?? true}
                    value="true"
                  />
                  <Label htmlFor="tlsRejectUnauthorized" className="text-sm font-normal cursor-pointer">
                    Reject unauthorized TLS certificates (recommended)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailEnabled"
                    name="emailEnabled"
                    defaultChecked={settings?.emailEnabled ?? false}
                    value="true"
                  />
                  <Label htmlFor="emailEnabled" className="text-sm font-medium cursor-pointer">
                    Enable email delivery
                  </Label>
                </div>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {state.error}
                </div>
              )}
              {state.success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {state.success}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Test Email Card */}
        <Card className="mt-6">
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

            {testResult && (
              <div
                className={`flex items-start gap-2 p-3 border rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Test email sent successfully!' : 'Failed to send email'}
                  </p>
                  {testResult.error && (
                    <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                  )}
                </div>
              </div>
            )}

            {!emailEnabled && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Email delivery is disabled. Enable it above and save settings first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Provider Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Supported Email Providers</CardTitle>
            <CardDescription>
              Common SMTP configurations for popular email providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-sm mb-2">Gmail</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Host: smtp.gmail.com</p>
                  <p>Port: 587</p>
                  <p>SSL: No (uses STARTTLS)</p>
                  <p className="text-yellow-700 mt-2">
                    Requires App Password if 2FA is enabled
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-sm mb-2">Outlook / Office 365</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Host: smtp-mail.outlook.com</p>
                  <p>Port: 587</p>
                  <p>SSL: No (uses STARTTLS)</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-sm mb-2">SendGrid</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Host: smtp.sendgrid.net</p>
                  <p>Port: 587</p>
                  <p>User: apikey</p>
                  <p>Password: Your API Key</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-sm mb-2">AWS SES</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Host: email-smtp.{'{region}'}.amazonaws.com</p>
                  <p>Port: 587</p>
                  <p>Use SMTP credentials from AWS</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Features */}
        <Card className="mt-6">
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
    </section>
  );
}
