'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '../actions';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Please check your email or request a new verification link.');
      return;
    }

    async function verify() {
      try {
        const formData = new FormData();
        formData.append('token', token!);
        const result = await verifyEmail({ token: token! }, formData);

        if (result?.error) {
          setStatus('error');
          setErrorMessage(result.error);
        } else {
          setStatus('success');
          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('An error occurred while verifying your email. Please try again.');
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {status === 'loading' && (
            <div className="rounded-full bg-blue-100 p-3">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && 'Email verified!'}
          {status === 'error' && 'Verification failed'}
        </h2>

        <div className="mt-2 text-center">
          {status === 'loading' && (
            <p className="text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          )}
          {status === 'success' && (
            <div>
              <p className="text-sm text-gray-600">
                Your email has been successfully verified.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Redirecting to sign in...
              </p>
            </div>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600 mt-2">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {status !== 'loading' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              {status === 'success' && (
                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to sign in
                </Link>
              )}

              {status === 'error' && (
                <>
                  <Link
                    href="/resend-verification"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Request new verification link
                  </Link>
                  <div className="text-center">
                    <Link
                      href="/sign-in"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Return to sign in
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
