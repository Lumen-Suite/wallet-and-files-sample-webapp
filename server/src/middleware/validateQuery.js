import { z } from 'zod'

const SORT_FIELDS = new Set([
  'Name', '_ts', 'FileExtension', 'CreatedAt', 'UpdatedAt', 'OwnerAddress',
])

const numericString = (min, max, fallback) =>
  z.preprocess((v) => (v === undefined || v === '' ? fallback : Number(v)),
    z.number().int().min(min).max(max))

const sortFieldSchema = z.string().optional().refine(
  (v) => v === undefined || SORT_FIELDS.has(v),
  { message: 'Unsupported sort field' },
)

const pathSchema = z.string().min(1).max(1024)
  .refine((v) => /^[A-Za-z0-9_\-./%() ]+$/.test(v), { message: 'Path contains invalid characters' })

const md5Base64 = z.string().regex(/^[A-Za-z0-9+/]{22}==$/, 'Checksum must be base64-encoded MD5 (16 bytes)')

export const loginConfigBody = z.object({
  AllowedLoginMethods: z.object({
    Wallets: z.array(z.enum(['METAMASK'])).optional(),
    SocialMedia: z.array(z.enum(['GOOGLE', 'FACEBOOK'])).optional(),
  }).refine(
    (m) => (m.Wallets?.length || 0) + (m.SocialMedia?.length || 0) > 0,
    { message: 'At least one login method (Wallets or SocialMedia) must be provided' },
  ),
  RedirectURL: z.string().url(),
}).passthrough()

export const listQuery = z.object({
  pageNumber: numericString(1, 10000, 1),
  pageSize: numericString(1, 100, 10),
  search: z.string().max(200).optional(),
  'sort[0][field]': sortFieldSchema,
  'sort[0][order]': z.enum(['asc', 'desc']).optional(),
}).passthrough()

export const pathOnlyQuery = z.object({ path: pathSchema }).passthrough()

export const uploadBody = z.object({
  Name: z.string().min(1).max(255),
  FileExtension: z.string().min(1).max(32),
  Checksum: md5Base64,
  Description: z.string().max(2000).optional().default(''),
})

export function validateQuery(schema, source = 'query') {
  return (req, _res, next) => {
    const data = source === 'body' ? req.body : req.query
    const result = schema.safeParse(data)
    if (!result.success) {
      const err = new Error(result.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '))
      err.status = 400
      return next(err)
    }
    if (source === 'body') req.body = result.data
    else req.query = result.data
    next()
  }
}

export function requireUserToken(req, _res, next) {
  const t = req.headers['lumen-user-token']
  if (!t) {
    const err = new Error('Missing lumen-user-token header')
    err.status = 401
    return next(err)
  }
  req.userToken = t
  next()
}
