'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ComponentProps } from 'react';
import { seedDefaultUnits } from '@/lib/products/unit-actions';
import { toast } from 'sonner';
import { Database, Loader2 } from 'lucide-react';

interface SeedDefaultUnitsButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {}

export function SeedDefaultUnitsButton({ 
  variant = 'default', 
  size = 'default',
  ...props 
}: SeedDefaultUnitsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSeedUnits = async () => {
    setIsLoading(true);
    try {
      const result = await seedDefaultUnits();
      
      if (result.success) {
        toast.success(result.success);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to seed default units');
      }
    } catch (error) {
      toast.error('Failed to seed default units');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSeedUnits}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Database className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Seeding...' : 'Seed Default Units'}
    </Button>
  );
}