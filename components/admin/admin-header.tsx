'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlatformAdmin } from '@/lib/db/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { adminSignOut } from '@/app/(admin)/admin/login/actions';
import {
  Menu,
  X,
  Shield,
  LogOut,
  Users,
  Building2,
  Mail,
  Settings,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  admin: PlatformAdmin;
}

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Building2 },
  { name: 'Email Settings', href: '/admin/email-settings', icon: Mail },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function AdminHeader({ admin }: AdminHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  async function handleSignOut() {
    await adminSignOut();
  }

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800 md:ml-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {isMobileNavOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="md:hidden flex items-center">
              <Shield className="h-6 w-6 text-purple-400" />
              <span className="ml-2 text-lg font-semibold text-white">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Platform Admin
            </span>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer size-9 border-2 border-purple-500">
                  <AvatarFallback className="bg-purple-600 text-white">
                    {(admin.name || admin.email)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{admin.name || 'Admin'}</div>
                  <div className="text-gray-500 text-xs">{admin.email}</div>
                </div>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-gray-900 z-50 md:hidden shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-400" />
                  <span className="ml-2 text-xl font-semibold text-white">
                    Admin
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {adminNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
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
              <div className="px-2 pb-4 border-t border-gray-800 pt-4">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <ArrowLeft className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                  Back to App
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
