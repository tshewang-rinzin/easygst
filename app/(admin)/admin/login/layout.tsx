import { Suspense } from 'react';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin login page has its own layout without authentication requirement
  return <Suspense fallback={<div className="min-h-screen bg-purple-900" />}>{children}</Suspense>;
}
