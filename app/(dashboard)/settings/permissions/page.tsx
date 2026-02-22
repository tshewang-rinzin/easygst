'use client';

import { Fragment, useEffect, useState } from 'react';
import { Shield, Check, X, Crown, ShieldCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Permission = {
  action: string;
  owner: boolean;
  admin: boolean;
  member: boolean;
};

type PermissionModule = {
  module: string;
  permissions: Permission[];
};

const permissionsData: PermissionModule[] = [
  {
    module: 'Sales',
    permissions: [
      { action: 'Create invoices', owner: true, admin: true, member: true },
      { action: 'Edit invoices', owner: true, admin: true, member: true },
      { action: 'Delete invoices', owner: true, admin: true, member: false },
      { action: 'Cancel invoices', owner: true, admin: true, member: false },
      { action: 'Lock invoices', owner: true, admin: true, member: false },
      { action: 'Create credit notes', owner: true, admin: true, member: true },
      { action: 'Delete credit notes', owner: true, admin: true, member: false },
    ],
  },
  {
    module: 'Customers',
    permissions: [
      { action: 'Create customers', owner: true, admin: true, member: true },
      { action: 'Edit customers', owner: true, admin: true, member: true },
      { action: 'Delete customers', owner: true, admin: true, member: false },
    ],
  },
  {
    module: 'Contracts',
    permissions: [
      { action: 'Create contracts', owner: true, admin: true, member: true },
      { action: 'Edit contracts', owner: true, admin: true, member: true },
      { action: 'Delete contracts', owner: true, admin: true, member: false },
      { action: 'Invoice from contract', owner: true, admin: true, member: true },
    ],
  },
  {
    module: 'Purchases',
    permissions: [
      { action: 'Create supplier bills', owner: true, admin: true, member: true },
      { action: 'Edit supplier bills', owner: true, admin: true, member: true },
      { action: 'Delete supplier bills', owner: true, admin: true, member: false },
      { action: 'Cancel supplier bills', owner: true, admin: true, member: false },
      { action: 'Create debit notes', owner: true, admin: true, member: true },
      { action: 'Delete debit notes', owner: true, admin: true, member: false },
    ],
  },
  {
    module: 'Payments',
    permissions: [
      { action: 'Record payments', owner: true, admin: true, member: true },
      { action: 'Delete payments', owner: true, admin: true, member: false },
      { action: 'Record advances', owner: true, admin: true, member: true },
      { action: 'Delete advances', owner: true, admin: true, member: false },
    ],
  },
  {
    module: 'Products & Inventory',
    permissions: [
      { action: 'Create products', owner: true, admin: true, member: true },
      { action: 'Edit products', owner: true, admin: true, member: true },
      { action: 'Delete products', owner: true, admin: true, member: false },
      { action: 'Manage categories', owner: true, admin: true, member: true },
      { action: 'Delete categories', owner: true, admin: true, member: false },
      { action: 'Adjust inventory', owner: true, admin: true, member: true },
    ],
  },
  {
    module: 'GST & Compliance',
    permissions: [
      { action: 'View GST summary', owner: true, admin: true, member: true },
      { action: 'File GST returns', owner: true, admin: false, member: false },
      { action: 'Lock periods', owner: true, admin: false, member: false },
      { action: 'View reports', owner: true, admin: true, member: true },
    ],
  },
  {
    module: 'Settings',
    permissions: [
      { action: 'Business profile', owner: true, admin: false, member: false },
      { action: 'Email settings', owner: true, admin: false, member: false },
      { action: 'Bank accounts', owner: true, admin: true, member: true },
      { action: 'Delete bank accounts', owner: true, admin: true, member: false },
      { action: 'Payment methods', owner: true, admin: true, member: true },
      { action: 'Delete payment methods', owner: true, admin: true, member: false },
      { action: 'Tax classifications', owner: true, admin: true, member: true },
      { action: 'Reset tax defaults', owner: true, admin: false, member: false },
      { action: 'Units management', owner: true, admin: true, member: true },
      { action: 'Reset unit defaults', owner: true, admin: false, member: false },
      { action: 'Document numbering', owner: true, admin: true, member: true },
    ],
  },
  {
    module: 'User Management',
    permissions: [
      { action: 'Invite users', owner: true, admin: false, member: false },
      { action: 'Change roles', owner: true, admin: false, member: false },
      { action: 'Remove members', owner: true, admin: false, member: false },
    ],
  },
];

const roleConfig = [
  {
    key: 'owner' as const,
    label: 'Owner',
    description: 'Full access. Can manage business settings, users, GST filing, and all operations.',
    icon: Crown,
    color: 'bg-orange-500',
    borderColor: 'border-orange-200',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  {
    key: 'admin' as const,
    label: 'Admin',
    description: 'Can perform all operations including deleting records. Cannot manage business settings or users.',
    icon: ShieldCheck,
    color: 'bg-blue-500',
    borderColor: 'border-blue-200',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    key: 'member' as const,
    label: 'Member',
    description: 'Can create and edit records. Cannot delete records or change settings.',
    icon: User,
    color: 'bg-gray-500',
    borderColor: 'border-gray-200',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-700',
  },
];

function PermissionBadge({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600">
      <Check className="h-4 w-4" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400">
      <X className="h-4 w-4" />
    </span>
  );
}

export default function PermissionsPage() {
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({ owner: 0, admin: 0, member: 0 });

  useEffect(() => {
    fetch('/api/users/team-members')
      .then((res) => res.json())
      .then((data) => {
        const members = Array.isArray(data) ? data : data?.members ?? [];
        const counts: Record<string, number> = { owner: 0, admin: 0, member: 0 };
        for (const m of members) {
          const role = m.role ?? 'member';
          counts[role] = (counts[role] || 0) + 1;
        }
        setRoleCounts(counts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles &amp; Permissions</h2>
          <p className="text-muted-foreground">Overview of what each role can do in the system</p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {roleConfig.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.key} className={`${role.borderColor}`}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${role.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{role.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {roleCounts[role.key]} {roleCounts[role.key] === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Action</TableHead>
                  <TableHead className="text-center w-[100px]">Owner</TableHead>
                  <TableHead className="text-center w-[100px]">Admin</TableHead>
                  <TableHead className="text-center w-[100px]">Member</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsData.map((mod) => (
                  <Fragment key={`module-${mod.module}`}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={4} className="font-semibold text-sm py-2">
                        {mod.module}
                      </TableCell>
                    </TableRow>
                    {mod.permissions.map((perm) => (
                      <TableRow key={`${mod.module}-${perm.action}`}>
                        <TableCell className="pl-8 text-sm">{perm.action}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <PermissionBadge allowed={perm.owner} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <PermissionBadge allowed={perm.admin} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <PermissionBadge allowed={perm.member} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
