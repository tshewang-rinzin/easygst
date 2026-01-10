'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createTaxClassification,
  updateTaxClassification,
  deleteTaxClassification,
  resetToDefaultTaxClassifications,
} from '@/lib/tax-classifications/actions';
import { Loader2, Plus, Pencil, Trash2, AlertCircle, CheckCircle2, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import type { TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

interface TaxClassificationFormProps {
  classification?: TaxClassification;
  onCancel?: () => void;
  onSuccess?: () => void;
}

function TaxClassificationForm({ classification, onCancel, onSuccess }: TaxClassificationFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    classification ? updateTaxClassification : createTaxClassification,
    {}
  );

  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'purple', label: 'Purple' },
    { value: 'gray', label: 'Gray' },
  ];

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4">
      {classification && (
        <input type="hidden" name="id" value={classification.id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code" className="mb-2">
            Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            name="code"
            placeholder="e.g., STANDARD, ZERO_RATED"
            defaultValue={classification?.code || ''}
            required
            disabled={isPending}
          />
          <p className="text-xs text-gray-500 mt-1">
            Uppercase letters and underscores only
          </p>
        </div>

        <div>
          <Label htmlFor="name" className="mb-2">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Standard-Rated (5%)"
            defaultValue={classification?.name || ''}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="mb-2">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe when to use this classification..."
          defaultValue={classification?.description || ''}
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="taxRate" className="mb-2">
            Tax Rate (%) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="taxRate"
            name="taxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="5.00"
            defaultValue={
              classification?.taxRate
                ? parseFloat(classification.taxRate)
                : ''
            }
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="color" className="mb-2">
            Badge Color
          </Label>
          <select
            id="color"
            name="color"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            defaultValue={classification?.color || 'blue'}
            disabled={isPending}
          >
            {colorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="sortOrder" className="mb-2">
            Sort Order
          </Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            placeholder="0"
            defaultValue={classification?.sortOrder || 0}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="canClaimInputCredits"
          name="canClaimInputCredits"
          defaultChecked={classification?.canClaimInputCredits ?? true}
          disabled={isPending}
        />
        <div>
          <Label htmlFor="canClaimInputCredits" className="cursor-pointer font-medium">
            Can Claim Input Tax Credits
          </Label>
          <p className="text-xs text-gray-500">
            Enable for Standard and Zero-Rated; disable for Exempt
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          name="isActive"
          defaultChecked={classification?.isActive ?? true}
          disabled={isPending}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{state.success}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {classification ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{classification ? 'Update Classification' : 'Create Classification'}</>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface TaxClassificationRowProps {
  classification: TaxClassification;
  onEdit: () => void;
  onDelete: () => void;
}

function TaxClassificationRow({ classification, onEdit, onDelete }: TaxClassificationRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tax classification?')) {
      return;
    }

    setIsDeleting(true);
    const formData = new FormData();
    formData.append('id', classification.id.toString());

    try {
      await deleteTaxClassification({}, formData);
      onDelete();
    } catch (error) {
      console.error('Error deleting classification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const badgeColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              badgeColors[classification.color || 'blue'] || badgeColors.blue
            }`}
          >
            {classification.code}
          </span>
          <div>
            <h3 className="font-medium text-gray-900">{classification.name}</h3>
            {classification.description && (
              <p className="text-sm text-gray-500 mt-1">{classification.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <span>Rate: {parseFloat(classification.taxRate)}%</span>
              <span>
                Input Credits: {classification.canClaimInputCredits ? 'Yes' : 'No'}
              </span>
              <span>
                Status: {classification.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={isDeleting}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-red-600" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function TaxClassificationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingClassification, setEditingClassification] = useState<TaxClassification | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { data: classifications, mutate } = useSWR<TaxClassification[]>(
    '/api/tax-classifications',
    fetcher
  );

  const handleEdit = (classification: TaxClassification) => {
    setEditingClassification(classification);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClassification(null);
  };

  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to reset to default tax classifications? This will remove all custom classifications and restore the 3 Bhutan GST defaults (Standard, Zero-Rated, Exempt).'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetToDefaultTaxClassifications({}, new FormData());
      if ('success' in result && result.success) {
        mutate();
        alert(result.success);
      } else if ('error' in result && result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error resetting tax classifications:', error);
      alert('Failed to reset tax classifications');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSuccess = () => {
    mutate();
    setShowForm(false);
    setEditingClassification(null);
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Tax Classifications
          </h1>
          <p className="text-sm text-gray-500">
            Manage GST tax classifications for your products and services
          </p>
        </div>

        <div className="space-y-6">
          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Tax Classifications</CardTitle>
              <CardDescription>
                Tax classifications help you categorize products and services based on Bhutan GST rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="font-medium text-blue-900 mb-2">Standard Classifications:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
                  <li><strong>Standard (5%):</strong> Most goods and services - input credits claimable</li>
                  <li><strong>Zero-Rated (0%):</strong> Special supplies like exports - input credits claimable</li>
                  <li><strong>Exempt:</strong> Specific supplies like financial services - no input credits</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Create/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingClassification ? 'Edit Classification' : 'Create New Classification'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TaxClassificationForm
                  classification={editingClassification || undefined}
                  onCancel={handleCancel}
                  onSuccess={handleSuccess}
                />
              </CardContent>
            </Card>
          )}

          {/* Add Button */}
          {!showForm && (
            <div className="flex gap-3">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tax Classification
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

          {/* Classifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Classifications</CardTitle>
              <CardDescription>
                {classifications?.length || 0} classification(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!classifications ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : classifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <p>No tax classifications configured yet.</p>
                  <p className="text-sm mt-2">
                    Click "Add Tax Classification" to create your first classification.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classifications.map((classification) => (
                    <TaxClassificationRow
                      key={classification.id}
                      classification={classification}
                      onEdit={() => handleEdit(classification)}
                      onDelete={mutate}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
