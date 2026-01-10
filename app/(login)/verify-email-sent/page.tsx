import { Suspense } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

function VerifyEmailSentContent({
  searchParams
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-3">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification link to
        </p>
        {email && (
          <p className="mt-1 text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700">
                    Click the link in the email to verify your account and complete your
                    registration.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Didn't receive the email?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>The link expires in 24 hours</li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                href="/sign-in"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to sign in
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/resend-verification"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Resend verification email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailSentPage({
  searchParams
}: {
  searchParams: { email?: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailSentContent searchParams={searchParams} />
    </Suspense>
  );
}
