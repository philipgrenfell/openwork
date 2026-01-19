import { Router } from 'express'
import { proxyToOpenCode, proxySSEToOpenCode } from '../utils/opencode-client.js'

export const opencodeRouter = Router()

// SSE endpoint - special handling for streaming
opencodeRouter.get('/event', async (req, res) => {
  try {
    await proxySSEToOpenCode(req, res)
  } catch (error) {
    console.error('SSE proxy error:', error)
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to connect to OpenCode event stream',
        code: 'OPENCODE_SSE_ERROR' 
      })
    }
  }
})

// Generic proxy for all other OpenCode endpoints
opencodeRouter.all('/*', async (req, res) => {
  try {
    await proxyToOpenCode(req, res)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(502).json({ 
      error: 'Failed to connect to OpenCode',
      code: 'OPENCODE_OFFLINE',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
