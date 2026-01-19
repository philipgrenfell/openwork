import { Router } from 'express'
import { checkOpenCodeHealth } from '../utils/opencode-client.js'

export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  try {
    const opencodeHealth = await checkOpenCodeHealth()
    
    res.json({
      bridge: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      opencode: opencodeHealth,
    })
  } catch (error) {
    res.status(503).json({
      bridge: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      opencode: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
})
