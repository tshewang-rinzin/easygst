'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createUnit } from '@/lib/products/unit-actions';
import { Loader2 } from 'lucide-react';

interface CreateUnitDialogProps {
  children: React.ReactNode;
}

export function CreateUnitDialog({ children }: CreateUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUnit, {});
  const router = useRouter();

  // Close dialog and refresh on success
  if (state.success) {
    if (open) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Unit of Measure</DialogTitle>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Kilogram"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                name="abbreviation"
                placeholder="e.g., kg"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" required defaultValue="quantity">
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

          <div className="flex items-center space-x-2">
            <Checkbox name="isBaseUnit" id="isBaseUnit" />
            <Label htmlFor="isBaseUnit">
              Base Unit
            </Label>
            <span className="text-sm text-gray-500">
              (Mark this as the base unit for this type)
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionToBase">Conversion Factor to Base Unit</Label>
            <Input
              id="conversionToBase"
              name="conversionToBase"
              type="number"
              step="0.000001"
              min="0"
              placeholder="e.g., 1000 (if 1kg = 1000g)"
              defaultValue="1"
            />
            <p className="text-sm text-gray-500">
              How many base units equal 1 of this unit
            </p>
          </div>

          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Unit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}