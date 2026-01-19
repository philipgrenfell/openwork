import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { spawn } from 'child_process'
import { Router } from 'express'

export const workspaceRouter = Router()

const WORKSPACE_ROOT =
  process.env.OPENWORK_WORKSPACES_DIR || path.join(os.homedir(), '.openwork', 'workspaces')
const DEFAULT_MAX_DEPTH = 3
const DEFAULT_LIMIT = 500
const MAX_DEPTH_LIMIT = 8
const LIMIT_MAX = 2000

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
}

function isWithinRoot(root: string, target: string) {
  const normalizedRoot = path.resolve(root) + path.sep
  const normalizedTarget = path.resolve(target) + path.sep
  return normalizedTarget.startsWith(normalizedRoot)
}

function openWithDefaultApp(filePath: string) {
  if (process.platform === 'darwin') {
    const child = spawn('open', [filePath], { stdio: 'ignore', detached: true })
    child.unref()
    return
  }
  if (process.platform === 'win32') {
    const child = spawn('cmd', ['/c', 'start', '', filePath], {
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    })
    child.unref()
    return
  }
  const child = spawn('xdg-open', [filePath], { stdio: 'ignore', detached: true })
  child.unref()
}

function sanitizeRelativePath(input: string) {
  const normalized = input.replace(/\\/g, '/')
  if (!normalized || normalized.startsWith('/') || normalized.includes('..')) {
    return null
  }
  return normalized.replace(/^\/+/, '')
}

function getAllowedRoot() {
  const allowed = process.env.OPENWORK_ALLOWED_WORKSPACES_ROOT
  return allowed ? path.resolve(allowed) : path.resolve(WORKSPACE_ROOT)
}

async function listFiles(root: string, maxDepth: number, limit: number) {
  const results: string[] = []
  const walk = async (current: string, depth: number) => {
    if (results.length >= limit) return
    let entries: fs.Dirent[]
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch (error) {
      console.error('Failed to read directory:', current, error)
      return
    }

    for (const entry of entries) {
      if (results.length >= limit) return
      if (entry.name.startsWith('.')) continue
      if (entry.name === 'node_modules') continue
      if (entry.isSymbolicLink()) continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (depth < maxDepth) {
          await walk(fullPath, depth + 1)
        }
        continue
      }
      if (entry.isFile()) {
        results.push(path.relative(root, fullPath))
      }
    }
  }

  await walk(root, 0)
  return results
}

function parseNumber(value: unknown, fallback: number, max: number) {
  if (typeof value !== 'string') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(0, Math.floor(parsed)), max)
}

workspaceRouter.get('/', async (_req, res) => {
  res.json({ root: WORKSPACE_ROOT })
})

workspaceRouter.get('/files', async (req, res) => {
  const baseDir = typeof req.query.directory === 'string' ? req.query.directory : WORKSPACE_ROOT
  const resolvedBase = path.resolve(baseDir)
  const resolvedRoot = path.resolve(WORKSPACE_ROOT)
  if (!resolvedBase.startsWith(resolvedRoot)) {
    return res.status(400).json({ error: 'Invalid workspace directory', code: 'WORKSPACE_INVALID_DIR' })
  }

  const maxDepth = parseNumber(req.query.maxDepth, DEFAULT_MAX_DEPTH, MAX_DEPTH_LIMIT)
  const limit = parseNumber(req.query.limit, DEFAULT_LIMIT, LIMIT_MAX)
  const files = await listFiles(resolvedBase, maxDepth, limit)
  return res.json({ files })
})

workspaceRouter.post('/', async (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
  const name = sanitizeName(rawName) || `task-${Date.now()}`
  const target = path.join(WORKSPACE_ROOT, name)

  await fs.mkdir(target, { recursive: true })
  res.json({ path: target })
})

workspaceRouter.post('/import', async (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
  const name = sanitizeName(rawName) || `import-${Date.now()}`
  const files = Array.isArray(req.body?.files) ? req.body.files : []
  if (files.length === 0) {
    return res.status(400).json({ error: 'No files provided', code: 'WORKSPACE_FILES_REQUIRED' })
  }

  const target = path.join(WORKSPACE_ROOT, name)
  await fs.mkdir(target, { recursive: true })

  for (const file of files) {
    const filePath = typeof file?.path === 'string' ? sanitizeRelativePath(file.path) : null
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file path', code: 'WORKSPACE_INVALID_PATH' })
    }
    const content = typeof file?.content === 'string' ? file.content : ''
    const encoding = typeof file?.encoding === 'string' ? file.encoding : 'utf8'
    const absolutePath = path.resolve(target, filePath)
    if (!isWithinRoot(target, absolutePath)) {
      return res.status(400).json({ error: 'Path outside workspace', code: 'WORKSPACE_INVALID_PATH' })
    }
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    const data = encoding === 'base64' ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8')
    await fs.writeFile(absolutePath, data)
  }

  return res.json({ path: target, files: files.length })
})

workspaceRouter.post('/attach', async (req, res) => {
  const rawPath = typeof req.body?.path === 'string' ? req.body.path : ''
  if (!rawPath) {
    return res.status(400).json({ error: 'Missing path', code: 'WORKSPACE_PATH_REQUIRED' })
  }

  const resolvedTarget = path.resolve(rawPath)
  const allowedRoot = getAllowedRoot()
  if (!resolvedTarget.startsWith(allowedRoot)) {
    return res.status(400).json({ error: 'Path outside allowed root', code: 'WORKSPACE_INVALID_PATH' })
  }

  try {
    const stat = await fs.stat(resolvedTarget)
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory', code: 'WORKSPACE_INVALID_DIR' })
    }
  } catch {
    return res.status(404).json({ error: 'Directory not found', code: 'WORKSPACE_NOT_FOUND' })
  }

  return res.json({ path: resolvedTarget })
})

workspaceRouter.post('/open', async (req, res) => {
  const rawPath = typeof req.body?.path === 'string' ? req.body.path : ''
  if (!rawPath) {
    return res.status(400).json({ error: 'Missing path', code: 'WORKSPACE_PATH_REQUIRED' })
  }

  const baseDir = typeof req.body?.directory === 'string' ? req.body.directory : WORKSPACE_ROOT
  const resolvedBase = path.resolve(baseDir)
  const resolvedRoot = path.resolve(WORKSPACE_ROOT)
  if (!resolvedBase.startsWith(resolvedRoot)) {
    return res.status(400).json({ error: 'Invalid workspace directory', code: 'WORKSPACE_INVALID_DIR' })
  }

  const target = path.resolve(path.isAbsolute(rawPath) ? rawPath : path.join(resolvedBase, rawPath))
  if (!isWithinRoot(resolvedRoot, target)) {
    return res.status(400).json({ error: 'Path outside workspace', code: 'WORKSPACE_INVALID_PATH' })
  }

  try {
    await fs.access(target)
  } catch {
    return res.status(404).json({ error: 'File not found', code: 'WORKSPACE_FILE_NOT_FOUND' })
  }

  try {
    openWithDefaultApp(target)
    return res.json({ ok: true })
  } catch (error) {
    console.error('Failed to open file:', error)
    return res.status(500).json({ error: 'Failed to open file', code: 'WORKSPACE_OPEN_FAILED' })
  }
})
