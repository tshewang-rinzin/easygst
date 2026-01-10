import { getCategoryById } from '@/lib/categories/queries';
import { CategoryForm } from '@/components/categories/category-form';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Edit Product Category
          </h1>
          <p className="text-sm text-gray-500">
            Update category information
          </p>
        </div>

        <CategoryForm mode="edit" category={category} />
      </div>
    </section>
  );
}
