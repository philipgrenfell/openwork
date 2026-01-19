import type { Request, Response } from 'express'

const OPENCODE_BASE_URL = process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:4096'
const OPENCODE_USERNAME = process.env.OPENCODE_SERVER_USERNAME || 'opencode'
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || ''
const OPENCODE_HTTP_TIMEOUT_MS = Number(process.env.OPENCODE_HTTP_TIMEOUT_MS || 15000)
const OPENCODE_SSE_CONNECT_TIMEOUT_MS = Number(process.env.OPENCODE_SSE_CONNECT_TIMEOUT_MS || 4000)
const OPENCODE_SSE_RETRY_MS = Number(process.env.OPENCODE_SSE_RETRY_MS || 15000)
const OPENCODE_SSE_FAILURE_COOLDOWN_MS = Number(
  process.env.OPENCODE_SSE_FAILURE_COOLDOWN_MS || 5000
)
const OPENCODE_MESSAGE_TIMEOUT_MS = Number(process.env.OPENCODE_MESSAGE_TIMEOUT_MS || 120000)
const OPENCODE_CIRCUIT_FAILURES = Number(process.env.OPENCODE_CIRCUIT_FAILURES || 3)
const OPENCODE_CIRCUIT_WINDOW_MS = Number(process.env.OPENCODE_CIRCUIT_WINDOW_MS || 10000)
const OPENCODE_CIRCUIT_COOLDOWN_MS = Number(process.env.OPENCODE_CIRCUIT_COOLDOWN_MS || 5000)

const sseFailures = new Map<string, { count: number; lastFail: number }>()
const activeSse = new Map<string, AbortController>()

const circuitState = {
  failures: 0,
  firstFailure: 0,
  openUntil: 0,
}

function getAuthHeader(): Record<string, string> {
  if (OPENCODE_PASSWORD) {
    const credentials = Buffer.from(`${OPENCODE_USERNAME}:${OPENCODE_PASSWORD}`).toString('base64')
    return { Authorization: `Basic ${credentials}` }
  }
  return {}
}

function getRequestTimeoutMs(req: Request) {
  if (req.method === 'POST' && /\/session\/[^/]+\/message$/.test(req.path)) {
    return OPENCODE_MESSAGE_TIMEOUT_MS
  }
  if (req.method === 'POST' && /\/session\/[^/]+\/command$/.test(req.path)) {
    return OPENCODE_MESSAGE_TIMEOUT_MS
  }
  return OPENCODE_HTTP_TIMEOUT_MS
}

function getSseKey(req: Request) {
  const directory = typeof req.query.directory === 'string' ? req.query.directory : 'global'
  return directory || 'global'
}

function recordSseFailure(key: string) {
  const existing = sseFailures.get(key)
  const count = existing ? existing.count + 1 : 1
  sseFailures.set(key, { count, lastFail: Date.now() })
  return count
}

function shouldCooldownSse(key: string) {
  const failure = sseFailures.get(key)
  if (!failure) return false
  return Date.now() - failure.lastFail < OPENCODE_SSE_FAILURE_COOLDOWN_MS
}

function sendSseRetry(res: Response, reason: string, detail?: unknown, retryAfterMs = OPENCODE_SSE_RETRY_MS) {
  if (res.headersSent) return
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  res.write(`retry: ${retryAfterMs}\n`)
  const payload = JSON.stringify({ type: 'opencode.offline', reason, retryAfterMs, detail })
  res.write(`data: ${payload}\n\n`)
  res.end()
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: (error as Error & { cause?: unknown }).cause,
    }
  }
  return { error }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function circuitOpen(): boolean {
  return Date.now() < circuitState.openUntil
}

function recordCircuitSuccess() {
  circuitState.failures = 0
  circuitState.firstFailure = 0
  circuitState.openUntil = 0
}

function extractErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return undefined
  const err = error as { code?: string; cause?: { code?: string } }
  return err.code || err.cause?.code
}

function recordCircuitFailure(error?: unknown) {
  const now = Date.now()
  const code = extractErrorCode(error)
  if (code === 'EADDRNOTAVAIL' || code === 'ENOBUFS' || code === 'EMFILE') {
    circuitState.failures = OPENCODE_CIRCUIT_FAILURES
    circuitState.firstFailure = now
    circuitState.openUntil = now + OPENCODE_CIRCUIT_COOLDOWN_MS
    return
  }
  if (!circuitState.firstFailure || now - circuitState.firstFailure > OPENCODE_CIRCUIT_WINDOW_MS) {
    circuitState.firstFailure = now
    circuitState.failures = 1
  } else {
    circuitState.failures += 1
  }

  if (circuitState.failures >= OPENCODE_CIRCUIT_FAILURES) {
    circuitState.openUntil = now + OPENCODE_CIRCUIT_COOLDOWN_MS
  }
}

export async function checkOpenCodeHealth() {
  try {
    const response = await fetch(`${OPENCODE_BASE_URL}/global/health`, {
      headers: getAuthHeader(),
    })
    
    if (!response.ok) {
      throw new Error(`OpenCode returned ${response.status}`)
    }
    
    const data = await response.json()
    return { status: 'ok', ...data }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function proxyToOpenCode(req: Request, res: Response) {
  if (circuitOpen()) {
    res.status(503).json({
      error: 'OpenCode temporarily unavailable',
      code: 'OPENCODE_CIRCUIT_OPEN',
      retryAfterMs: OPENCODE_CIRCUIT_COOLDOWN_MS,
    })
    return
  }

  const path = req.path.replace(/^\//, '')
  const url = new URL(path, OPENCODE_BASE_URL)
  
  // Add query parameters
  Object.entries(req.query).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const headers: Record<string, string> = {
    ...getAuthHeader(),
    'Content-Type': 'application/json',
  }

  const controller = new AbortController()
  const timeoutMs = getRequestTimeoutMs(req)
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  res.on('close', () => {
    if (!res.writableEnded) {
      controller.abort()
    }
  })
  const options: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  }

  if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
    options.body = JSON.stringify(req.body)
  }

  try {
    const start = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Proxy -> OpenCode ${req.method} ${url.toString()}`)
    }
    const response = await fetch(url.toString(), options)
    clearTimeout(timeout)
    
    // Forward status and headers
    res.status(response.status)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value)
      }
    })
    
    const data = await response.text()
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Proxy <- OpenCode ${response.status} ${req.method} ${url.toString()} ${Date.now() - start}ms`)
    }
    recordCircuitSuccess()
    res.send(data)
  } catch (error) {
    clearTimeout(timeout)
    if (isAbortError(error)) {
      if (req.aborted || res.writableEnded) {
        return
      }
      if (timedOut && !res.headersSent) {
        res.status(504).json({
          error: 'OpenCode request timed out',
          code: 'OPENCODE_TIMEOUT',
        })
        return
      }
    }
    recordCircuitFailure(error)
    console.error(`Proxy error ${req.method} ${url.toString()}:`, error)
    throw new Error(`Failed to connect to OpenCode: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function proxySSEToOpenCode(req: Request, res: Response) {
  const url = new URL('/event', OPENCODE_BASE_URL)

  Object.entries(req.query).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })
  
  const sseKey = getSseKey(req)
  if (shouldCooldownSse(sseKey)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`SSE cooldown active ${url.toString()}`)
    }
    sendSseRetry(res, 'cooldown')
    return
  }
  if (circuitOpen()) {
    sendSseRetry(res, 'circuit-open', undefined, OPENCODE_CIRCUIT_COOLDOWN_MS)
    return
  }
  if (activeSse.has(sseKey)) {
    sendSseRetry(res, 'already-connected')
    return
  }

  let timeout: NodeJS.Timeout | null = null
  const controller = new AbortController()
  activeSse.set(sseKey, controller)
  try {
    const start = Date.now()
    timeout = setTimeout(() => controller.abort(), OPENCODE_SSE_CONNECT_TIMEOUT_MS)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`SSE -> OpenCode ${url.toString()}`)
    }
    const response = await fetch(url.toString(), {
      headers: getAuthHeader(),
      signal: controller.signal,
    })
    if (timeout) {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new Error(`OpenCode SSE endpoint returned ${response.status}`)
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`SSE <- OpenCode ${response.status} ${url.toString()} ${Date.now() - start}ms`)
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Handle client disconnect
    req.on('close', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`SSE client disconnected ${url.toString()}`)
      }
      controller.abort()
      activeSse.delete(sseKey)
      res.end()
    })

    // Stream the response
    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(decoder.decode(value, { stream: true }))
          }
        } catch (error) {
          if (!isAbortError(error)) {
            console.error('SSE stream error:', error)
          }
        } finally {
          activeSse.delete(sseKey)
          res.end()
        }
      }
      
      pump()
    }
    recordCircuitSuccess()
  } catch (error) {
    if (timeout) {
      clearTimeout(timeout)
    }
    const failCount = recordSseFailure(sseKey)
    const detail = { ...formatError(error), attempts: failCount }
    console.error(`SSE connection failed (${sseKey})`, detail)
    recordCircuitFailure(error)
    activeSse.delete(sseKey)
    sendSseRetry(res, 'connect-failed', detail)
  }
}
