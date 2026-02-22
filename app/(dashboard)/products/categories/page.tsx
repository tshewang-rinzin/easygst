import { getCategoryTree, type CategoryWithChildren } from '@/lib/categories/queries';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Edit, ChevronRight } from 'lucide-react';
import { CategoryActions } from '@/components/categories/category-actions';

function CategoryNode({ category, depth = 0 }: { category: CategoryWithChildren; depth?: number }) {
  return (
    <>
      <Card className={depth > 0 ? 'ml-6 border-l-4 border-l-orange-200' : ''}>
        <CardHeader className="py-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {depth > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              {category.description && (
                <CardDescription className="mt-1">
                  {category.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={category.isActive ? 'default' : 'secondary'}
                className={
                  category.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {category.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center gap-2">
            <Link href={`/products/categories/${category.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <CategoryActions
              categoryId={category.id}
              isActive={category.isActive}
            />
          </div>
        </CardContent>
      </Card>
      {category.children?.map((child) => (
        <CategoryNode key={child.id} category={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function CategoriesPage() {
  const categoryTree = await getCategoryTree(true);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Product Categories
          </h1>
          <p className="text-sm text-gray-500">
            Manage your product categories for better organization
          </p>
        </div>
        <Link href="/products/categories/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {categoryTree.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Link href="/products/categories/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first category
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categoryTree.map((category) => (
            <CategoryNode key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
