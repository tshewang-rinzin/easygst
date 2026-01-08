'use client';

import { useState, useActionState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Package, Check, X, RotateCcw } from 'lucide-react';
import { createUnit, updateUnit, deleteUnit, resetToDefaultUnits } from '@/lib/units/actions';
import useSWR, { mutate } from 'swr';
import { Unit } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UnitsSettingsPage() {
  const { data: units, isLoading } = useSWR<Unit[]>('/api/units', fetcher);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to reset to default units? This will remove all custom units and restore the 12 default units.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetToDefaultUnits({}, new FormData());
      if (result.success) {
        mutate('/api/units');
        alert(result.success);
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error resetting units:', error);
      alert('Failed to reset units');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-orange-600" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Units of Measurement
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage units used for products and invoices
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Add New Unit and Reset Buttons */}
        {!isAdding && (
          <div className="flex gap-3">
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting...' : 'Reset to Defaults'}
            </Button>
          </div>
        )}

        {/* Add Unit Form */}
        {isAdding && (
          <UnitForm
            onCancel={() => setIsAdding(false)}
            onSuccess={() => {
              setIsAdding(false);
              mutate('/api/units');
            }}
          />
        )}

        {/* Units List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Units</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : units && units.length > 0 ? (
              <div className="space-y-2">
                {units.map((unit) =>
                  editingId === unit.id ? (
                    <UnitForm
                      key={unit.id}
                      unit={unit}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => {
                        setEditingId(null);
                        mutate('/api/units');
                      }}
                    />
                  ) : (
                    <UnitRow
                      key={unit.id}
                      unit={unit}
                      onEdit={() => setEditingId(unit.id)}
                      onDelete={() => mutate('/api/units')}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No units added yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add your first unit to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function UnitRow({
  unit,
  onEdit,
  onDelete,
}: {
  unit: Unit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleteState, deleteAction] = useActionState(deleteUnit, { error: '' });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the unit "${unit.name}"?`)) {
      const formData = new FormData();
      formData.append('id', unit.id.toString());

      startTransition(() => {
        deleteAction(formData);
        onDelete();
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{unit.name}</h3>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            {unit.abbreviation}
          </span>
          {!unit.isActive && (
            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
              Inactive
            </span>
          )}
        </div>
        {unit.description && (
          <p className="text-sm text-gray-500 mt-1">{unit.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={isPending}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function UnitForm({
  unit,
  onCancel,
  onSuccess,
}: {
  unit?: Unit;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(
    unit ? updateUnit : createUnit,
    { error: '' }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
  };

  if (state.success) {
    onSuccess();
  }

  return (
    <Card className="border-orange-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {unit && <input type="hidden" name="id" value={unit.id} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                Unit Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Kilogram, Piece, Hour"
                defaultValue={unit?.name}
                required
              />
            </div>

            <div>
              <Label htmlFor="abbreviation">
                Abbreviation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="abbreviation"
                name="abbreviation"
                placeholder="e.g., kg, pcs, hr"
                defaultValue={unit?.abbreviation}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description"
              rows={2}
              defaultValue={unit?.description || ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortOrder">Display Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={unit?.sortOrder ?? 0}
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={unit?.isActive ?? true}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? (
                'Saving...'
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {unit ? 'Update' : 'Create'} Unit
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
