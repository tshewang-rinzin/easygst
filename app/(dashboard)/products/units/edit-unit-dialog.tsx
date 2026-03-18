'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10, 'Abbreviation must be 10 characters or less'),
  type: z.enum(['quantity', 'weight', 'volume', 'length', 'area', 'time']),
  isBaseUnit: z.boolean().default(false),
  conversionToBase: z.number().min(0, 'Conversion factor must be positive').default(1),
});

type FormData = z.infer<typeof formSchema>;

interface EditUnitDialogProps {
  unit: UnitOfMeasure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUnitDialog({ unit, open, onOpenChange }: EditUnitDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      abbreviation: '',
      type: 'quantity',
      isBaseUnit: false,
      conversionToBase: 1,
    },
  });

  const isBaseUnit = form.watch('isBaseUnit');

  // Reset form when unit changes
  useEffect(() => {
    if (unit) {
      form.reset({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: unit.type as 'quantity' | 'weight' | 'volume' | 'length' | 'area' | 'time',
        isBaseUnit: unit.isBaseUnit,
        conversionToBase: Number(unit.conversionToBase),
      });
    }
  }, [unit, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await updateUnit(data);
      
      if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update unit');
      }
    } catch (error) {
      toast.error('Failed to update unit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Unit of Measure</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Kilogram"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., kg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="quantity">Quantity (pieces, dozens, etc.)</SelectItem>
                      <SelectItem value="weight">Weight (grams, kilograms, etc.)</SelectItem>
                      <SelectItem value="volume">Volume (liters, milliliters, etc.)</SelectItem>
                      <SelectItem value="length">Length (meters, centimeters, etc.)</SelectItem>
                      <SelectItem value="area">Area (square meters, etc.)</SelectItem>
                      <SelectItem value="time">Time (hours, days, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isBaseUnit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Base Unit
                    </FormLabel>
                    <FormDescription>
                      Mark this as the base unit for this type. Other units will be converted relative to this one.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!isBaseUnit && (
              <FormField
                control={form.control}
                name="conversionToBase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion Factor to Base Unit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="e.g., 1000 (if 1kg = 1000g)"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      How many base units equal 1 of this unit. For example, if this is "kilogram" and the base unit is "gram", enter 1000.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Unit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}