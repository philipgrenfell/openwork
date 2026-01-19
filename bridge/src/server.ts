import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { healthRouter } from './routes/health.js'
import { opencodeRouter } from './routes/opencode.js'
import { workspaceRouter } from './routes/workspace.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Routes
app.use('/api/health', healthRouter)
app.use('/api/opencode', opencodeRouter)
app.use('/api/workspace', workspaceRouter)

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: err.message, code: 'INTERNAL_ERROR' })
})

app.listen(PORT, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`)
  console.log(`Proxying to OpenCode at ${process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:4096'}`)
})
