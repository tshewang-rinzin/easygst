'use client';

import { useState, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { adminSignIn } from './actions';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [state, formAction, isPending] = useActionState(adminSignIn, { error: '' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the platform administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {(state.error || error) && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{state.error || (error === 'inactive' ? 'Your account has been deactivated' : 'Authentication failed')}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="/admin/forgot-password" className="text-sm text-purple-600 hover:text-purple-500">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="/sign-in" className="text-sm text-gray-500 hover:text-gray-700">
              Not an admin? Go to user login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
