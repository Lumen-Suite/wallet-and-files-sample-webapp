import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { assertEnv } from './middleware/envCheck.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import filesRoutes from './routes/files.routes.js'

assertEnv()

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", process.env.ALLOWED_ORIGIN],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
)

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    credentials: false,
  }),
)

app.use(express.json({ limit: '32kb' }))
app.use(morgan('dev'))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})

app.get('/health', (_req, res) => res.json({ ok: true, service: 'wfs-server' }))

app.use('/api', apiLimiter)
app.use('/api', authRoutes)
app.use('/api', filesRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, status: 404, error: `Route not found: ${req.method} ${req.originalUrl}` })
})

app.use(errorHandler)

const port = Number(process.env.SERVER_PORT) || 8787
const server = app.listen(port, () => {
  console.log(`[wfs-server] SRV ready on ${port}`)
  console.log(`[wfs-server] Proxying to ${process.env.LUMEN_API_BASE_URL}`)
  console.log(`[wfs-server] CORS allows ${process.env.ALLOWED_ORIGIN}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${port} is already in use.`)
    console.error('Fix this by changing SERVER_PORT in your .env file.\n')
    process.exit(1)
  }
  throw err
})
