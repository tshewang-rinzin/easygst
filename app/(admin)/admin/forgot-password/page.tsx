'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import { requestAdminPasswordReset } from './actions';

function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestAdminPasswordReset, { error: '' });

  if ('success' in state && state.success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            {state.success}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/admin/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your admin email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {'error' in state && state.error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your admin email"
              required
              autoComplete="email"
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
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
