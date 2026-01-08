'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useActionState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember } from '@/app/(login)/actions';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  PlusCircle,
  FileText,
  DollarSign,
  ShoppingCart,
  Banknote,
  AlertCircle,
  Receipt,
  TrendingUp,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

type ActionState = {
  error?: string;
  success?: string;
};

interface DashboardMetrics {
  taxInvoices: { count: number; revenue: string };
  cashSales: { count: number; revenue: string };
  totalSales: { count: number; revenue: string };
  outstanding: { total: string; count: number };
  overdue: { count: number; amount: string };
  gst: { output: string; input: string; net: string };
  currency: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Sales Overview Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* GST Summary Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const { data: metrics } = useSWR<DashboardMetrics>('/api/dashboard/metrics', fetcher);

  const formatCurrency = (amount: string, currency: string = 'BTN') => {
    const numAmount = parseFloat(amount);
    return `${currency} ${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currency = metrics?.currency || 'BTN';

  return (
    <div className="space-y-8">
      {/* Sales Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          <Link href="/sales/invoices">
            <Button variant="link" className="text-orange-600 hover:text-orange-700">
              View all sales <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tax Invoices */}
          <Card className="border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tax Invoices (Credit)
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.taxInvoices?.count ?? 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(metrics?.taxInvoices?.revenue || '0.00', currency)}
              </p>
              <Link href="/sales/invoices">
                <Button variant="link" className="px-0 mt-2 text-blue-600">
                  Manage invoices →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cash Sales */}
          <Card className="border-green-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cash Sales (Immediate)
              </CardTitle>
              <Banknote className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.cashSales?.count ?? 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(metrics?.cashSales?.revenue || '0.00', currency)}
              </p>
              <Link href="/sales/cash-sales">
                <Button variant="link" className="px-0 mt-2 text-green-600">
                  View cash sales →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.totalSales?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.totalSales?.revenue || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">From all paid sales</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GST Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">GST Summary</h2>
          <Link href="/reports/gst-summary">
            <Button variant="link" className="text-orange-600 hover:text-orange-700">
              View GST report <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Output GST */}
          <Card className="border-purple-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Output GST (Sales)
              </CardTitle>
              <Receipt className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics?.gst?.output || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">GST collected from customers</p>
            </CardContent>
          </Card>

          {/* Input GST */}
          <Card className="border-indigo-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Input GST (Purchases)
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(metrics?.gst?.input || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">GST paid on purchases</p>
            </CardContent>
          </Card>

          {/* Net GST */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net GST Payable
              </CardTitle>
              <Wallet className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(metrics?.gst?.net || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Output GST - Input GST</p>
              <Link href="/gst-returns/prepare">
                <Button variant="link" className="px-0 mt-2 text-orange-600">
                  Prepare return →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Outstanding & Overdue */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outstanding */}
          <Card className="border-yellow-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unpaid Invoices
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics?.outstanding?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.outstanding?.total || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Total amount due</p>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className="border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue Invoices
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics?.overdue?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.overdue?.amount || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Past due date</p>
              <Link href="/reports/outstanding">
                <Button variant="link" className="px-0 mt-2 text-red-600">
                  View details →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/sales/invoices/new">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-orange-300 border-2">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Create Tax Invoice</p>
                <p className="text-xs text-gray-500 mt-1">Credit sale with payment terms</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sales/cash-sales/new">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-green-300 border-2">
              <CardContent className="pt-6 text-center">
                <Banknote className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Record Cash Sale</p>
                <p className="text-xs text-gray-500 mt-1">Immediate payment receipt</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/payments/receive">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300 border-2">
              <CardContent className="pt-6 text-center">
                <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Receive Payment</p>
                <p className="text-xs text-gray-500 mt-1">Record customer payment</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/gst-summary">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-purple-300 border-2">
              <CardContent className="pt-6 text-center">
                <Receipt className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">GST Reports</p>
                <p className="text-xs text-gray-500 mt-1">View tax reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TeamMembersSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No team members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamData.teamMembers.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {getUserDisplayName(member.user)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.role}
                  </p>
                </div>
              </div>
              {index > 1 ? (
                <form action={removeAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRemovePending}
                  >
                    {isRemovePending ? 'Removing...' : 'Remove'}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-500 mt-4">{removeState.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!isOwner}
            />
          </div>
          <div>
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">Member</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your sales, purchases, and GST obligations
        </p>
      </div>

      {/* Main Dashboard Overview */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>

      {/* Team Management Section */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Management</h2>
        <Suspense fallback={<TeamMembersSkeleton />}>
          <TeamMembers />
        </Suspense>
        <Suspense fallback={<InviteTeamMemberSkeleton />}>
          <InviteTeamMember />
        </Suspense>
      </div>
    </section>
  );
}
