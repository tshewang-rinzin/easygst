'use client';

import { useEffect, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUnit } from '@/lib/products/unit-actions';
import { UnitOfMeasure } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';

interface EditUnitDialogProps {
  unit: UnitOfMeasure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUnitDialog({ unit, open, onOpenChange }: EditUnitDialogProps) {
  const [state, formAction, pending] = useActionState(updateUnit, {
    error: '',
  });
  const router = useRouter();

  // Local state for form fields
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    type: 'quantity' as 'quantity' | 'weight' | 'volume' | 'length' | 'area' | 'time',
    isBaseUnit: false,
    conversionToBase: '1',
  });

  // Reset form when unit changes
  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: unit.type as 'quantity' | 'weight' | 'volume' | 'length' | 'area' | 'time',
        isBaseUnit: unit.isBaseUnit,
        conversionToBase: unit.conversionToBase,
      });
    }
  }, [unit]);

  // Close dialog and refresh on success
  useEffect(() => {
    if ('success' in state && state.success) {
      if (open) {
        onOpenChange(false);
        router.refresh();
      }
    }
  }, [state, open, onOpenChange, router]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Unit of Measure</DialogTitle>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4">
          {/* Hidden input for unit ID */}
          <input type="hidden" name="id" value={unit?.id || ''} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Kilogram"
                required
                maxLength={50}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                name="abbreviation"
                placeholder="e.g., kg"
                required
                maxLength={10}
                value={formData.abbreviation}
                onChange={(e) => handleInputChange('abbreviation', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              name="type" 
              required 
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantity (pieces, dozens, etc.)</SelectItem>
                <SelectItem value="weight">Weight (grams, kilograms, etc.)</SelectItem>
                <SelectItem value="volume">Volume (liters, milliliters, etc.)</SelectItem>
                <SelectItem value="length">Length (meters, centimeters, etc.)</SelectItem>
                <SelectItem value="area">Area (square meters, etc.)</SelectItem>
                <SelectItem value="time">Time (hours, days, etc.)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <Checkbox 
              id="isBaseUnit" 
              checked={formData.isBaseUnit}
              onCheckedChange={(checked) => handleInputChange('isBaseUnit', !!checked)}
            />
            <input 
              type="hidden" 
              name="isBaseUnit" 
              value={formData.isBaseUnit.toString()} 
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="isBaseUnit">
                Base Unit
              </Label>
              <p className="text-sm text-gray-500">
                Mark this as the base unit for this type. Other units will be converted relative to this one.
              </p>
            </div>
          </div>

          {!formData.isBaseUnit && (
            <div className="space-y-2">
              <Label htmlFor="conversionToBase">Conversion Factor to Base Unit</Label>
              <Input
                id="conversionToBase"
                name="conversionToBase"
                type="number"
                step="0.000001"
                min="0"
                placeholder="e.g., 1000 (if 1kg = 1000g)"
                value={formData.conversionToBase}
                onChange={(e) => handleInputChange('conversionToBase', e.target.value)}
              />
              <p className="text-sm text-gray-500">
                How many base units equal 1 of this unit. For example, if this is "kilogram" and the base unit is "gram", enter 1000.
              </p>
            </div>
          )}

          {'error' in state && state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Unit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}