'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Store, 
  ArrowLeft,
  Settings
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { 
  createBusinessType, 
  updateBusinessType, 
  deleteBusinessType 
} from '@/lib/master-products/actions';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export default function BusinessTypesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);

  const { data, isLoading } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/admin/business-types', // We'll need to create this endpoint
    fetcher
  );

  const handleEdit = (businessType: BusinessType) => {
    setEditingType(businessType);
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingType(null);
    setShowDialog(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete business type "${name}"? This will affect all related products and categories.`)) return;
    
    const result = await deleteBusinessType({ id }) as { success?: string; error?: string };
    if (result.success) {
      toast.success(result.success);
      mutate('/api/admin/business-types');
    } else {
      toast.error(result.error || 'Failed to delete business type');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Link href="/admin/master-products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Types</h1>
            <p className="text-gray-500 mt-1">Manage business categories for product classification</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          New Business Type
        </Button>
      </div>

      {/* Business Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Types</CardTitle>
          <CardDescription>
            Different types of businesses that will have specific product catalogs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading business types...</p>
            </div>
          ) : data?.businessTypes.length === 0 ? (
            <div className="p-8 text-center">
              <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No business types found</h3>
              <p className="text-gray-500 mb-4">Create your first business type to get started</p>
              <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Business Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.businessTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {type.icon && (
                          <span className="text-lg">{type.icon}</span>
                        )}
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {type.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-gray-600 truncate">
                        {type.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={type.isActive ? 'default' : 'secondary'}
                        className={type.isActive ? 'bg-green-100 text-green-700' : ''}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(type.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(type.id, type.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <BusinessTypeDialog
          businessType={editingType}
          onClose={() => {
            setShowDialog(false);
            setEditingType(null);
          }}
          onSaved={() => {
            setShowDialog(false);
            setEditingType(null);
            mutate('/api/admin/business-types');
          }}
        />
      )}
    </div>
  );
}

function BusinessTypeDialog({
  businessType,
  onClose,
  onSaved,
}: {
  businessType: BusinessType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(businessType?.name || '');
  const [slug, setSlug] = useState(businessType?.slug || '');
  const [description, setDescription] = useState(businessType?.description || '');
  const [icon, setIcon] = useState(businessType?.icon || '');
  const [isActive, setIsActive] = useState(businessType?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!businessType) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    const data = { name, slug, description, icon, isActive };

    const result = (businessType
      ? await updateBusinessType({ id: businessType.id, ...data })
      : await createBusinessType(data)) as { success?: string; error?: string };

    if (result.success) {
      toast.success(result.success);
      onSaved();
    } else {
      toast.error(result.error || 'Failed to save business type');
    }

    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {businessType ? 'Edit Business Type' : 'Create Business Type'}
          </DialogTitle>
          <DialogDescription>
            Business types help categorize products for different industries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Grocery Store"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., grocery"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in URLs and for filtering. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🏪 (optional emoji)"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this business type..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="text-sm">
              Active (visible to teams)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !name.trim() || !slug.trim()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? 'Saving...' : businessType ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}