'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  FileText, 
  Users, 
  BarChart3, 
  Loader2, 
  Mail,
  Zap,
  Shield
} from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { getInvitationByToken } from '@/lib/users/actions';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteToken = searchParams.get('token');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );
  const [invitationDetails, setInvitationDetails] = useState<{
    email: string;
    role: string;
    teamName: string;
    invitedBy: string;
  } | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'signup' && inviteToken) {
      getInvitationByToken(inviteToken).then((result) => {
        if (result.success && result.invitation) {
          setInvitationDetails(result.invitation);
        } else {
          setInvitationError(result.error || 'Invalid invitation');
        }
      });
    }
  }, [inviteToken, mode]);

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-amber-800 to-amber-900 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-16 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/3 right-20 w-24 h-24 bg-white/8 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/12 rounded-full blur-md"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold tracking-tight">EasyGST</h1>
            <p className="text-xl font-medium text-amber-100 mt-2">
              Simple GST Invoicing for Bhutan
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Easy Invoice Generation</h3>
                <p className="text-amber-100 text-sm">Create professional invoices in minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">GST Compliant</h3>
                <p className="text-amber-100 text-sm">Fully compliant with Bhutan's GST regulations</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Multi-Business Support</h3>
                <p className="text-amber-100 text-sm">Manage multiple businesses from one account</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-Time Reports</h3>
                <p className="text-amber-100 text-sm">Track your business performance instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-amber-800">EasyGST</h1>
            <p className="text-gray-600 text-sm mt-1">Simple GST Invoicing for Bhutan</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {invitationDetails
                ? `Join ${invitationDetails.teamName}`
                : mode === 'signin'
                ? 'Welcome back'
                : 'Create account'}
            </h2>
            <p className="text-gray-600">
              {invitationDetails
                ? 'Complete your team registration below'
                : mode === 'signin'
                ? 'Please sign in to your account'
                : 'Start your GST invoicing journey'}
            </p>
          </div>

          {/* Error Messages */}
          {invitationError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{invitationError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Invitation Details */}
          {invitationDetails && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {invitationDetails.invitedBy} invited you to join{' '}
                    {invitationDetails.teamName}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Role: <span className="font-semibold">{invitationDetails.role}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteToken" value={inviteToken || ''} />

            {mode === 'signup' && (
              <div>
                <Label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={invitationDetails?.email || state.email}
                readOnly={!!invitationDetails}
                required
                maxLength={50}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  invitationDetails ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </Label>
                {mode === 'signin' && (
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-amber-800 hover:text-amber-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            {/* Form Error */}
            {state?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-800">{state.error}</p>
                    {state.error.toLowerCase().includes('verify your email') && (
                      <p className="mt-2 text-sm">
                        <Link
                          href={`/resend-verification${state.email ? `?email=${encodeURIComponent(state.email)}` : ''}`}
                          className="font-medium text-red-800 underline hover:text-red-700"
                        >
                          Resend verification email →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Please wait...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : invitationDetails ? (
                'Join Team'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  {mode === 'signin' ? 'New to EasyGST?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                  redirect ? `?redirect=${redirect}` : ''
                }${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in to existing account'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
