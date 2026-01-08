import { CategoryForm } from '@/components/categories/category-form';

export default function NewCategoryPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Create Product Category
          </h1>
          <p className="text-sm text-gray-500">
            Add a new category to organize your products
          </p>
        </div>

        <CategoryForm mode="create" />
      </div>
    </section>
  );
}
