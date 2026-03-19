'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { UnitOfMeasure } from '@/lib/db/schema';
// TODO: Add edit and delete dialogs
import { useState } from 'react';

interface UnitsOfMeasureTableProps {
  units: UnitOfMeasure[];
}

const unitTypeColors = {
  quantity: 'bg-blue-100 text-blue-800',
  weight: 'bg-green-100 text-green-800', 
  volume: 'bg-purple-100 text-purple-800',
  length: 'bg-amber-100 text-amber-950',
  area: 'bg-pink-100 text-pink-800',
  time: 'bg-gray-100 text-gray-800',
} as const;

export function UnitsOfMeasureTable({ units }: UnitsOfMeasureTableProps) {

  // Group units by type
  const groupedUnits = units.reduce((groups, unit) => {
    const type = unit.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(unit);
    return groups;
  }, {} as Record<string, UnitOfMeasure[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedUnits).map(([type, typeUnits]) => (
        <div key={type} className="space-y-3">
          <h3 className="text-lg font-medium capitalize flex items-center gap-2">
            <Badge className={unitTypeColors[type as keyof typeof unitTypeColors]}>
              {type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({typeUnits.length} unit{typeUnits.length !== 1 ? 's' : ''})
            </span>
          </h3>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead>Base Unit</TableHead>
                  <TableHead>Conversion to Base</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{unit.abbreviation}</Badge>
                    </TableCell>
                    <TableCell>
                      {unit.isBaseUnit ? (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          Base Unit
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {unit.isBaseUnit ? (
                        <span className="text-muted-foreground">1</span>
                      ) : (
                        <span>
                          {Number(unit.conversionToBase).toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* TODO: Add edit and delete dialogs */}
    </div>
  );
}