import { Suspense } from 'react';
import { getUnitsOfMeasure } from '@/lib/products/unit-actions';
import { UnitsOfMeasureTable } from './units-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Database } from 'lucide-react';
import { CreateUnitDialog } from './create-unit-dialog-simple';
import { SeedDefaultUnitsButton } from './seed-default-units-button';

async function UnitsPageContent() {
  const result = await getUnitsOfMeasure();

  if (!result.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Error loading units: {result.error}
        </p>
      </div>
    );
  }

  const units = result.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Units of Measure</h1>
          <p className="text-muted-foreground">
            Manage units of measure for your products with conversion factors
          </p>
        </div>
        <div className="flex gap-2">
          {units.length === 0 && <SeedDefaultUnitsButton />}
          <CreateUnitDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </CreateUnitDialog>
        </div>
      </div>

      {/* Empty State */}
      {units.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No units of measure</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first unit or seeding default units.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <SeedDefaultUnitsButton variant="outline" />
            <CreateUnitDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Unit
              </Button>
            </CreateUnitDialog>
          </div>
        </div>
      ) : (
        /* Units Table */
        <UnitsOfMeasureTable units={units} />
      )}
    </div>
  );
}

export default function UnitsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<UnitsPageSkeleton />}>
        <UnitsPageContent />
      </Suspense>
    </section>
  );
}

function UnitsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}