export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}

export async function onRequestError(
  err: Error,
  request: { method: string; url: string }
) {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request)
}
