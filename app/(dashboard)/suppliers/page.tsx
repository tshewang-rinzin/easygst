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
import { getSuppliers } from '@/lib/suppliers/queries';
import { PlusCircle, Users, Phone, Mail, MapPin } from 'lucide-react';

async function SuppliersList() {
  const suppliers = await getSuppliers();

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No suppliers found</p>
          <p className="text-sm text-gray-400 mb-6">
            Create your first supplier to start managing purchases
          </p>
          <Link href="/suppliers/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Suppliers ({suppliers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    {supplier.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {supplier.contactPerson || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {supplier.email ? (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {supplier.mobile ? (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {supplier.mobile}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {supplier.gstNumber || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {supplier.city || supplier.dzongkhag ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[supplier.city, supplier.dzongkhag].filter(Boolean).join(', ')}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/suppliers/${supplier.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SuppliersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuppliersPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Suppliers
          </h1>
          <p className="text-sm text-gray-500">
            Manage your vendors and suppliers
          </p>
        </div>
        <Link href="/suppliers/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      <Suspense fallback={<SuppliersListSkeleton />}>
        <SuppliersList />
      </Suspense>
    </section>
  );
}
