import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import {
  getTourRevenueByCategory,
  getTourSDFReport,
  getTourGuestNationalityStats,
  getTourTypeStats,
} from '@/lib/db/tour-invoice-queries';
import { CATEGORY_MAP } from '@/lib/tour-invoice/category-presets';

function getDateRange(range: string): { dateFrom?: Date; dateTo?: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (range) {
    case 'this-month':
      return { dateFrom: new Date(year, month, 1), dateTo: new Date(year, month + 1, 0, 23, 59, 59) };
    case 'last-month':
      return { dateFrom: new Date(year, month - 1, 1), dateTo: new Date(year, month, 0, 23, 59, 59) };
    case 'this-quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return { dateFrom: new Date(year, qStart, 1), dateTo: new Date(year, qStart + 3, 0, 23, 59, 59) };
    }
    case 'this-year':
      return { dateFrom: new Date(year, 0, 1), dateTo: new Date(year, 11, 31, 23, 59, 59) };
    case 'all':
    default:
      return {};
  }
}

async function RevenueByCategorySection({ dateFrom, dateTo }: { dateFrom?: Date; dateTo?: Date }) {
  const data = await getTourRevenueByCategory(dateFrom, dateTo);
  const grandTotal = data.reduce((s, r) => s + parseFloat(r.totalAmount), 0);

  return (
    <Card>
      <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data for this period</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">{CATEGORY_MAP[row.category]?.label || row.category}</TableCell>
                    <TableCell className="text-right">{parseFloat(row.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{grandTotal > 0 ? ((parseFloat(row.totalAmount) / grandTotal) * 100).toFixed(1) : '0'}%</TableCell>
                    <TableCell className="text-right">{row.itemCount}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  <TableCell className="text-right">{data.reduce((s, r) => s + r.itemCount, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {/* Simple bar visualization */}
            <div className="mt-4 space-y-2">
              {data.map((row) => {
                const pct = grandTotal > 0 ? (parseFloat(row.totalAmount) / grandTotal) * 100 : 0;
                return (
                  <div key={row.category} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-gray-600">{CATEGORY_MAP[row.category]?.label || row.category}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-orange-500 h-4 rounded-full" style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                    <span className="w-14 text-right text-gray-500">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

async function SDFReportSection({ dateFrom, dateTo }: { dateFrom?: Date; dateTo?: Date }) {
  const data = await getTourSDFReport(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader><CardTitle>SDF Collection Report</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data for this period</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="text-right">Total Guests</TableHead>
                <TableHead className="text-right">SDF Amount (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{row.invoiceCount}</TableCell>
                  <TableCell className="text-right">{row.totalGuests}</TableCell>
                  <TableCell className="text-right font-medium">{parseFloat(row.sdfAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{data.reduce((s, r) => s + r.invoiceCount, 0)}</TableCell>
                <TableCell className="text-right">{data.reduce((s, r) => s + r.totalGuests, 0)}</TableCell>
                <TableCell className="text-right">{data.reduce((s, r) => s + parseFloat(r.sdfAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

async function NationalitySection({ dateFrom, dateTo }: { dateFrom?: Date; dateTo?: Date }) {
  const data = await getTourGuestNationalityStats(dateFrom, dateTo);
  const totalGuests = data.reduce((s, r) => s + r.guestCount, 0);

  return (
    <Card>
      <CardHeader><CardTitle>Guest Nationality Distribution</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data for this period</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nationality</TableHead>
                <TableHead className="text-right">Guests</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.nationality}>
                  <TableCell className="font-medium">{row.nationality}</TableCell>
                  <TableCell className="text-right">{row.guestCount}</TableCell>
                  <TableCell className="text-right">{totalGuests > 0 ? ((row.guestCount / totalGuests) * 100).toFixed(1) : '0'}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

async function TourTypeSection({ dateFrom, dateTo }: { dateFrom?: Date; dateTo?: Date }) {
  const data = await getTourTypeStats(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader><CardTitle>Tour Type Analytics</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data for this period</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour Type</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="text-right">Guests</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.tourType}>
                  <TableCell className="font-medium capitalize">{row.tourType}</TableCell>
                  <TableCell className="text-right">{row.invoiceCount}</TableCell>
                  <TableCell className="text-right">{row.totalGuests}</TableCell>
                  <TableCell className="text-right font-medium">{parseFloat(row.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function TourInvoiceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range || 'all';
  const { dateFrom, dateTo } = getDateRange(range);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/tour-invoices">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Tour Invoice Reports</h1>
            <p className="text-sm text-gray-500">Revenue analytics, SDF collection & guest insights</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/tour-invoices/reports" method="get" className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Time' },
              { value: 'this-month', label: 'This Month' },
              { value: 'last-month', label: 'Last Month' },
              { value: 'this-quarter', label: 'This Quarter' },
              { value: 'this-year', label: 'This Year' },
            ].map((opt) => (
              <Button
                key={opt.value}
                type="submit"
                name="range"
                value={opt.value}
                variant={range === opt.value ? 'default' : 'outline'}
                size="sm"
                className={range === opt.value ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                {opt.label}
              </Button>
            ))}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <RevenueByCategorySection dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <SDFReportSection dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <NationalitySection dateFrom={dateFrom} dateTo={dateTo} />
          </Suspense>

          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <TourTypeSection dateFrom={dateFrom} dateTo={dateTo} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
