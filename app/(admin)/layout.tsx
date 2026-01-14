import { getPlatformAdmin } from '@/lib/db/queries';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if admin is authenticated
  const admin = await getPlatformAdmin();

  // If not authenticated, just render children (login page handles its own layout)
  if (!admin) {
    return <>{children}</>;
  }

  // Check if admin is active
  if (!admin.isActive) {
    redirect('/admin/login?error=inactive');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <AdminHeader admin={admin} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
