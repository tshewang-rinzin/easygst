export default function Loading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      <div className="h-12 bg-gray-100 rounded-lg animate-pulse mb-6" />
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        ))}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </section>
  );
}
