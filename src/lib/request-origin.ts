/** Server-configured canonical origin protects cookie-authenticated mutations. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === (process.env.APP_ORIGIN || process.env.EXERCISE_ORIGIN || new URL(request.url).origin) && request.headers.get('sec-fetch-site') !== 'cross-site';
}
