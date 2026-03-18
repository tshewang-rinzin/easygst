'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Package2 } from 'lucide-react';
import { getUnitsOfMeasure, getProductUnits, setProductUnits } from '@/lib/products/unit-actions';
import { UnitOfMeasure } from '@/lib/db/schema';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductUnit {
  unitId: string;
  isDefault: boolean;
  pricePerUnit?: number;
  conversionFactor: number;
  barcode?: string;
}

interface ProductUnitsWithDetails extends ProductUnit {
  unitName: string;
  unitAbbreviation: string;
  unitType: string;
}

interface ProductUnitsSectionProps {
  productId?: string; // For editing existing products
  defaultPrice?: number;
  onUnitsChange?: (units: ProductUnit[]) => void;
}

export function ProductUnitsSection({ 
  productId, 
  defaultPrice = 0,
  onUnitsChange 
}: ProductUnitsSectionProps) {
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);
  const [productUnits, setProductUnitsState] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load units of measure on mount
  useEffect(() => {
    const loadUnits = async () => {
      setLoading(true);
      try {
        const result = await getUnitsOfMeasure();
        if (result.success && result.data) {
          setUnitsOfMeasure(result.data);
        } else {
          console.error('Failed to load units:', result.error);
        }
      } catch (error) {
        console.error('Failed to load units:', error);
      }
      setLoading(false);
    };

    loadUnits();
  }, []);

  // Load existing product units if editing
  useEffect(() => {
    const loadProductUnits = async () => {
      if (!productId) return;

      try {
        const result = await getProductUnits(productId);
        if (result.success && result.data) {
          const units = result.data.map(unit => ({
            unitId: unit.unitId,
            isDefault: unit.isDefault,
            pricePerUnit: unit.pricePerUnit ? Number(unit.pricePerUnit) : undefined,
            conversionFactor: Number(unit.conversionFactor),
            barcode: unit.barcode || undefined,
          }));
          setProductUnitsState(units);
        }
      } catch (error) {
        console.error('Failed to load product units:', error);
      }
    };

    if (productId) {
      loadProductUnits();
    }
  }, [productId]);

  // Notify parent of changes
  useEffect(() => {
    onUnitsChange?.(productUnits);
  }, [productUnits, onUnitsChange]);

  const addUnit = () => {
    const newUnit: ProductUnit = {
      unitId: '',
      isDefault: productUnits.length === 0, // First unit is default
      pricePerUnit: defaultPrice,
      conversionFactor: 1,
      barcode: '',
    };
    setProductUnitsState([...productUnits, newUnit]);
  };

  const updateUnit = (index: number, field: keyof ProductUnit, value: any) => {
    const updated = productUnits.map((unit, i) => {
      if (i === index) {
        // If setting this as default, unset others
        if (field === 'isDefault' && value === true) {
          return { ...unit, [field]: value };
        }
        return { ...unit, [field]: value };
      }
      // If setting another unit as default, unset this one
      if (field === 'isDefault' && value === true) {
        return { ...unit, isDefault: false };
      }
      return unit;
    });
    setProductUnitsState(updated);
  };

  const removeUnit = (index: number) => {
    const updated = productUnits.filter((_, i) => i !== index);
    // If we removed the default unit, make the first remaining unit default
    if (productUnits[index].isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setProductUnitsState(updated);
  };

  const saveUnits = async () => {
    if (!productId) return;

    setSaving(true);
    try {
      const result = await setProductUnits({
        productId,
        units: productUnits.filter(u => u.unitId), // Only save units with selected unit
      });
      
      if (result.success) {
        toast.success('Product units updated successfully');
      } else {
        toast.error(result.error || 'Failed to save units');
      }
    } catch (error) {
      toast.error('Failed to save units');
    } finally {
      setSaving(false);
    }
  };

  const getUnitDetails = (unitId: string) => {
    return unitsOfMeasure.find(u => u.id === unitId);
  };

  const groupedUnits = unitsOfMeasure.reduce((groups, unit) => {
    const type = unit.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(unit);
    return groups;
  }, {} as Record<string, UnitOfMeasure[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Units of Measure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading units...</div>
        </CardContent>
      </Card>
    );
  }

  if (unitsOfMeasure.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Units of Measure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 border-2 border-dashed rounded-lg">
            <Package2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              No units of measure configured. Set up units to enable multiple pricing options.
            </p>
            <Link href="/products/units">
              <Button size="sm">
                Manage Units
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Units of Measure
          </span>
          <div className="flex gap-2">
            <Link href="/products/units">
              <Button variant="outline" size="sm">
                Manage Units
              </Button>
            </Link>
            <Button onClick={addUnit} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {productUnits.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed rounded-lg">
            <Package2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              This product uses the default unit. Add multiple units to enable different pricing.
            </p>
            <Button onClick={addUnit} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Price per Unit</TableHead>
                  <TableHead>Conversion Factor</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productUnits.map((productUnit, index) => {
                  const unitDetails = getUnitDetails(productUnit.unitId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={productUnit.unitId}
                          onValueChange={(value) => updateUnit(index, 'unitId', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(groupedUnits).map(([type, units]) => (
                              <div key={type}>
                                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {type}
                                </div>
                                {units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.abbreviation})
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                        {unitDetails && (
                          <div className="text-xs text-gray-500 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {unitDetails.type}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={productUnit.isDefault}
                          onCheckedChange={(checked) => 
                            updateUnit(index, 'isDefault', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={productUnit.pricePerUnit || ''}
                          onChange={(e) => 
                            updateUnit(index, 'pricePerUnit', 
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0"
                          placeholder="1"
                          value={productUnit.conversionFactor}
                          onChange={(e) => 
                            updateUnit(index, 'conversionFactor', 
                              parseFloat(e.target.value) || 1
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Barcode"
                          value={productUnit.barcode || ''}
                          onChange={(e) => updateUnit(index, 'barcode', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnit(index)}
                          disabled={productUnits.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {productId && (
              <div className="flex justify-end">
                <Button
                  onClick={saveUnits}
                  disabled={saving || productUnits.some(u => !u.unitId)}
                >
                  {saving ? 'Saving...' : 'Save Units'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hidden inputs for form submission when creating new products */}
        {!productId && (
          <>
            <input 
              type="hidden" 
              name="productUnits" 
              value={JSON.stringify(productUnits.filter(u => u.unitId))} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}