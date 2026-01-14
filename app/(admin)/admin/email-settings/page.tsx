import { db } from '@/lib/db/drizzle';
import { emailSettings } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Server, Shield, CheckCircle, XCircle } from 'lucide-react';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

async function getEmailSettings() {
  const [settings] = await db.select().from(emailSettings).limit(1);
  return settings;
}

export default async function AdminEmailSettingsPage() {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const settings = await getEmailSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure platform-wide email settings
        </p>
      </div>

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-purple-500" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Email server settings for sending notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!settings ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No email settings configured yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Email settings can be configured through the application.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">Email Status</span>
                </div>
                {settings.isEnabled ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">SMTP Host</div>
                  <div className="font-medium">{settings.smtpHost || 'Not configured'}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">SMTP Port</div>
                  <div className="font-medium">{settings.smtpPort || 'Not configured'}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">From Email</div>
                  <div className="font-medium">{settings.fromEmail || 'Not configured'}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">From Name</div>
                  <div className="font-medium">{settings.fromName || 'Not configured'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Secure Connection (TLS)</div>
                  <div className="font-medium">
                    {settings.smtpSecure ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              {settings.updatedAt && (
                <div className="text-sm text-gray-500 text-right">
                  Last updated: {new Date(settings.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
