export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: NodeJS.Dict<string | string[]> },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context)
}
