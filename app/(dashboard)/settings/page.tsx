import Link from 'next/link';
import { Building2, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const settingsPages = [
    {
      title: 'Business Settings',
      description: 'Manage your business information, TPN, GST Number, address, and logo',
      href: '/settings/business',
      icon: Building2,
    },
    {
      title: 'Bank Accounts',
      description: 'Manage your bank accounts, payment methods, and QR codes for receiving payments',
      href: '/settings/bank-accounts',
      icon: CreditCard,
    },
    {
      title: 'GST Configuration',
      description: 'Configure default GST rates and tax settings for Bhutan DRC compliance',
      href: '/settings/tax',
      icon: Receipt,
    },
  ];

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Settings
          </h1>
          <p className="text-sm text-gray-500">
            Manage your business settings and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {settingsPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link key={page.href} href={page.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      {page.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
