import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Server, Database, Shield } from 'lucide-react';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure platform-wide settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-500" />
              System Information
            </CardTitle>
            <CardDescription>
              Current system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Platform Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Environment</span>
              <span className="font-medium">{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Node Version</span>
              <span className="font-medium">{process.version}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Database
            </CardTitle>
            <CardDescription>
              Database configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Database Type</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">ORM</span>
              <span className="font-medium">Drizzle</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Connection</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Admin Account
            </CardTitle>
            <CardDescription>
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{admin.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{admin.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Last Login</span>
              <span className="font-medium">
                {admin.lastLoginAt
                  ? new Date(admin.lastLoginAt).toLocaleString()
                  : 'Never'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              Features
            </CardTitle>
            <CardDescription>
              Platform features status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Email Notifications</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">GST Returns</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Multi-Currency</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
