export function errorHandler(err, req, res, _next) {
  const upstreamStatus = err?.response?.status
  const upstreamBody = err?.response?.data

  if (upstreamStatus !== undefined && upstreamBody !== undefined) {
    if (upstreamStatus >= 500) {
      console.error('[server-error]', req.method, req.originalUrl, '-', upstreamStatus, JSON.stringify(upstreamBody))
    }
    return res.status(upstreamStatus).json(upstreamBody)
  }

  const status = err.status ?? 500
  const message = err.message || 'Unexpected error'
  if (status >= 500) {
    console.error('[server-error]', req.method, req.originalUrl, '-', message)
  }
  res.status(status).json({ ok: false, status, error: message })
}
