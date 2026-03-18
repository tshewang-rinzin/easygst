'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getProductUnits } from '@/lib/products/unit-actions';

interface ProductUnitOption {
  id: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  unitType: string;
  isDefault: boolean;
  pricePerUnit: string | null;
  conversionFactor: string;
  barcode: string | null;
}

interface UnitSelectorProps {
  productId: string | null;
  selectedUnitId?: string;
  onUnitChange?: (unit: ProductUnitOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultUnit?: string; // Fallback unit name for products without UOM setup
}

export function UnitSelector({
  productId,
  selectedUnitId,
  onUnitChange,
  disabled = false,
  placeholder = "Select unit",
  className,
  defaultUnit = "piece"
}: UnitSelectorProps) {
  const [units, setUnits] = useState<ProductUnitOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Load product units when productId changes
  useEffect(() => {
    const loadUnits = async () => {
      if (!productId) {
        setUnits([]);
        return;
      }

      setLoading(true);
      try {
        const result = await getProductUnits(productId);
        if (result.success && result.data) {
          const unitOptions = result.data.map(unit => ({
            id: unit.id,
            unitId: unit.unitId,
            unitName: unit.unitName,
            unitAbbreviation: unit.unitAbbreviation,
            unitType: unit.unitType,
            isDefault: unit.isDefault,
            pricePerUnit: unit.pricePerUnit,
            conversionFactor: unit.conversionFactor,
            barcode: unit.barcode,
          }));
          setUnits(unitOptions);

          // Auto-select default unit if no unit is selected
          if (!selectedUnitId) {
            const defaultUnitOption = unitOptions.find(u => u.isDefault) || unitOptions[0];
            if (defaultUnitOption) {
              onUnitChange?.(defaultUnitOption);
            }
          }
        } else {
          setUnits([]);
          // If no UOM setup, pass null to indicate fallback to default unit
          onUnitChange?.(null);
        }
      } catch (error) {
        console.error('Failed to load product units:', error);
        setUnits([]);
        onUnitChange?.(null);
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, [productId]); // Remove onUnitChange from deps to avoid infinite loop

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  // If no units are configured for this product, show the fallback unit
  if (!productId || units.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <Badge variant="outline">{defaultUnit}</Badge>
      </div>
    );
  }

  // If only one unit, just display it
  if (units.length === 1) {
    const unit = units[0];
    return (
      <div className={`text-sm ${className}`}>
        <Badge variant="outline">
          {unit.unitName} ({unit.unitAbbreviation})
        </Badge>
        {unit.pricePerUnit && (
          <div className="text-xs text-gray-500 mt-1">
            Price: {Number(unit.pricePerUnit).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <Select
      value={selectedUnitId || ''}
      onValueChange={(value) => {
        const unit = units.find(u => u.id === value);
        onUnitChange?.(unit || null);
      }}
      disabled={disabled || loading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder}>
          {selectedUnit && (
            <span className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedUnit.unitName} ({selectedUnit.unitAbbreviation})
              </Badge>
              {selectedUnit.pricePerUnit && (
                <span className="text-xs text-gray-500">
                  @ {Number(selectedUnit.pricePerUnit).toLocaleString()}
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {unit.unitType}
                </Badge>
                <span>
                  {unit.unitName} ({unit.unitAbbreviation})
                </span>
                {unit.isDefault && (
                  <Badge className="text-xs bg-green-100 text-green-800">
                    Default
                  </Badge>
                )}
              </div>
              {unit.pricePerUnit && (
                <span className="text-xs text-gray-500 ml-2">
                  {Number(unit.pricePerUnit).toLocaleString()}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper hook to get unit details for calculations
export function useUnitDetails(productId: string | null, unitId: string | null) {
  const [unit, setUnit] = useState<ProductUnitOption | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUnit = async () => {
      if (!productId || !unitId) {
        setUnit(null);
        return;
      }

      setLoading(true);
      try {
        const result = await getProductUnits(productId);
        if (result.success && result.data) {
          const unitData = result.data.find(u => u.id === unitId);
          if (unitData) {
            setUnit({
              id: unitData.id,
              unitId: unitData.unitId,
              unitName: unitData.unitName,
              unitAbbreviation: unitData.unitAbbreviation,
              unitType: unitData.unitType,
              isDefault: unitData.isDefault,
              pricePerUnit: unitData.pricePerUnit,
              conversionFactor: unitData.conversionFactor,
              barcode: unitData.barcode,
            });
          } else {
            setUnit(null);
          }
        } else {
          setUnit(null);
        }
      } catch (error) {
        console.error('Failed to load unit details:', error);
        setUnit(null);
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
  }, [productId, unitId]);

  return { unit, loading };
}