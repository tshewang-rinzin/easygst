'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  CircleIcon,
  Home,
  LogOut,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  FileEdit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    children: [
      { name: 'Tax Invoices', href: '/sales/invoices' },
      { name: 'Cash Sales', href: '/sales/cash-sales' },
      { name: 'Customers', href: '/customers' },
      { name: 'Sales Register', href: '/sales/register' },
    ]
  },
  {
    name: 'Purchases',
    icon: ShoppingBag,
    children: [
      { name: 'Supplier Bills', href: '/purchases/bills' },
      { name: 'Suppliers', href: '/suppliers' },
      { name: 'Purchase Register', href: '/purchases/register' },
    ]
  },
  {
    name: 'Adjustments',
    icon: FileEdit,
    children: [
      { name: 'Invoice Adjustments', href: '/adjustments/invoices' },
      { name: 'Bill Adjustments', href: '/adjustments/bills' },
    ]
  },
  {
    name: 'Payments',
    icon: Wallet,
    children: [
      { name: 'Receive Payments', href: '/payments/receive' },
      { name: 'Pay Suppliers', href: '/payments/pay-suppliers' },
      { name: 'Payment Receipts', href: '/payments/receipts' },
      { name: 'Customer Advances', href: '/payments/advances/customer' },
      { name: 'Supplier Advances', href: '/payments/advances/supplier' },
    ]
  },
  {
    name: 'GST Returns',
    icon: FileSpreadsheet,
    children: [
      { name: 'GST Summary', href: '/gst/summary' },
      { name: 'Prepare Return', href: '/gst/prepare' },
      { name: 'Period Lock', href: '/gst/period-lock' },
      { name: 'Filed Returns', href: '/gst/filed-returns' },
    ]
  },
  {
    name: 'Reports',
    icon: BarChart3,
    children: [
      { name: 'GST Reports', href: '/reports/gst' },
      { name: 'Output GST (Sales)', href: '/reports/output-gst' },
      { name: 'Input GST (Purchases)', href: '/reports/input-gst' },
      { name: 'Exempt vs Zero-rated', href: '/reports/exempt-zero' },
      { name: 'Unpaid Invoices', href: '/reports/unpaid-invoices' },
      { name: 'Unpaid Bills', href: '/reports/unpaid-bills' },
      { name: 'Activity Report', href: '/reports/activity' },
    ]
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Business Profile', href: '/settings/business' },
      { name: 'Bank Accounts', href: '/settings/bank-accounts' },
      { name: 'Payment Methods', href: '/settings/payment-methods' },
      { name: 'Tax Setup', href: '/settings/tax' },
      { name: 'Tax Classifications', href: '/settings/tax-classifications' },
      { name: 'Units', href: '/settings/units' },
      { name: 'Document Numbering', href: '/settings/numbering' },
      { name: 'Users & Roles', href: '/settings/users' },
      { name: 'Data Backup', href: '/settings/backup' },
      { name: 'Templates', href: '/settings/templates' },
    ]
  }
];

function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const expanded: string[] = [];
    navigation.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (isChildActive) {
          expanded.push(item.name);
        }
      }
    });
    return expanded;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((name) => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-gray-50 border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <CircleIcon className="h-8 w-8 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            EasyGST
          </span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedSections.includes(item.name);
              const hasActiveChild = item.children.some(
                (child) => pathname === child.href || pathname.startsWith(child.href + '/')
              );

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={cn(
                      'w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md',
                      hasActiveChild
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          'mr-3 flex-shrink-0 h-5 w-5',
                          hasActiveChild
                            ? 'text-orange-600'
                            : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isActive =
                          pathname === child.href || pathname.startsWith(child.href + '/');
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              'group flex items-center px-2 py-2 text-sm rounded-md',
                              isActive
                                ? 'bg-orange-100 text-orange-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const isActive = pathname === item.href || pathname.startsWith(item.href! + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive
                        ? 'text-orange-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            }
          })}
        </nav>
      </div>
    </aside>
  );
}

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const expanded: string[] = [];
    navigation.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (isChildActive) {
          expanded.push(item.name);
        }
      }
    });
    return expanded;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((name) => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <CircleIcon className="h-8 w-8 text-orange-500" />
                  <span className="ml-2 text-xl font-semibold text-gray-900">
                    EasyGST
                  </span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2">
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  if (item.children) {
                    const isExpanded = expandedSections.includes(item.name);
                    const hasActiveChild = item.children.some(
                      (child) => pathname === child.href || pathname.startsWith(child.href + '/')
                    );

                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={cn(
                            'w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md',
                            hasActiveChild
                              ? 'bg-orange-50 text-orange-600'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={cn(
                                'mr-3 flex-shrink-0 h-5 w-5',
                                hasActiveChild
                                  ? 'text-orange-600'
                                  : 'text-gray-400 group-hover:text-gray-500'
                              )}
                            />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-9 mt-1 space-y-1">
                            {item.children.map((child) => {
                              const isActive =
                                pathname === child.href || pathname.startsWith(child.href + '/');
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  onClick={() => setIsOpen(false)}
                                  className={cn(
                                    'group flex items-center px-2 py-2 text-sm rounded-md',
                                    isActive
                                      ? 'bg-orange-100 text-orange-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  )}
                                >
                                  {child.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const isActive = pathname === item.href || pathname.startsWith(item.href! + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href!}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                          isActive
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 flex-shrink-0 h-5 w-5',
                            isActive
                              ? 'text-orange-600'
                              : 'text-gray-400 group-hover:text-gray-500'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  }
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Header() {
  return (
    <header className="md:pl-64 border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MobileMenu />
          <div className="md:hidden flex items-center">
            <CircleIcon className="h-6 w-6 text-orange-500" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              EasyGST
            </span>
          </div>
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
