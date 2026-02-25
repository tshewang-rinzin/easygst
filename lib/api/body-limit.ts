import { NextResponse } from 'next/server';

/**
 * Check Content-Length header against a max body size.
 * Returns an error response if exceeded, or null if OK.
 *
 * Note: This checks the declared Content-Length header.
 * Vercel serverless functions also enforce a hard 4.5MB limit.
 *
 * @param request - The incoming request
 * @param maxBytes - Maximum allowed body size in bytes (default: 1MB)
 */
export function checkBodySize(
  request: Request,
  maxBytes: number = 1 * 1024 * 1024
): NextResponse | null {
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return NextResponse.json(
      { error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)}KB.` },
      { status: 413 }
    );
  }

  return null;
}
