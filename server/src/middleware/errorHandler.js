export function errorHandler(err, req, res, _next) {
  const upstreamStatus = err?.response?.status
  const upstreamBody = err?.response?.data
  const status = upstreamStatus ?? err.status ?? 500

  const message =
    upstreamBody?.errorMsg ||
    upstreamBody?.message ||
    upstreamBody?.error ||
    err.message ||
    'Unexpected error'

  if (status >= 500) {
    console.error('[server-error]', req.method, req.originalUrl, '-', message)
  }

  res.status(status).json({ ok: false, status, error: message })
}
