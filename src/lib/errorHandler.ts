/**
 * Safe Error Handling Utility
 * Converts technical exceptions, network failures, or raw backend responses
 * into user-friendly non-technical messages.
 */

export function formatSafeErrorMessage(err: any): string {
  // 1. Network / Internet connection issue
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Please check your internet connection and try again.';
  }

  if (
    err instanceof TypeError ||
    (err?.name === 'TypeError') ||
    (typeof err?.message === 'string' && (
      err.message.toLowerCase().includes('failed to fetch') ||
      err.message.toLowerCase().includes('networkerror') ||
      err.message.toLowerCase().includes('network request failed') ||
      err.message.toLowerCase().includes('load failed')
    ))
  ) {
    return 'Please check your internet connection and try again.';
  }

  // 2. Extract message if provided
  let rawMsg = '';
  if (typeof err === 'string') {
    rawMsg = err;
  } else if (err && typeof err.message === 'string') {
    rawMsg = err.message;
  } else if (err && typeof err.error === 'string') {
    rawMsg = err.error;
  }

  // 3. Verify message is clean and safe (no stack traces, paths, localhost, DB keywords)
  if (rawMsg && isSafeUserMessage(rawMsg)) {
    return rawMsg;
  }

  // 4. Default generic fallback
  return 'Something went wrong. Please try again later.';
}

/**
 * Checks if an error message string is safe for display to end users.
 * Rejects stack traces, internal paths, database errors, localhost, etc.
 */
export function isSafeUserMessage(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return false;

  const unsafePatterns = [
    /localhost/i,
    /127\.0\.0\.1/i,
    /node_modules/i,
    /at\s+[\w\d_.]+\s+\(/i, // Stack trace line
    /\b(SQL|PostgreSQL|Neon|Pool|econnrefused|econnreset|ENOTFOUND)\b/i,
    /syntaxerror/i,
    /typeerror/i,
    /referenceerror/i,
    /\/var\//i,
    /\/usr\//i,
    /C:\\/i,
    /process\.env/i,
    /eval at/i,
    /internal server error/i,
  ];

  for (const pattern of unsafePatterns) {
    if (pattern.test(msg)) {
      return false;
    }
  }

  return true;
}
