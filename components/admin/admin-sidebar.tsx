'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  Building2,
  Mail,
  Settings,
  LayoutDashboard,
  ArrowLeft,
  ScrollText,
  Crown,
} from 'lucide-react';

const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Teams',
    href: '/admin/teams',
    icon: Building2,
  },
  {
    name: 'Plans & Features',
    href: '/admin/plans',
    icon: Crown,
  },
  {
    name: 'Email Settings',
    href: '/admin/email-settings',
    icon: Mail,
  },
  {
    name: 'Audit Log',
    href: '/admin/audit-log',
    icon: ScrollText,
  },
  {
    name: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-gray-900 text-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <Shield className="h-8 w-8 text-purple-400" />
          <span className="ml-2 text-xl font-semibold">
            Platform Admin
          </span>
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          {adminNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-4">
          <Link
            href="/dashboard"
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            Back to App
          </Link>
        </div>
      </div>
    </aside>
  );
}
