# AGENTS.md - Openwork Development Guide

This file provides guidelines for AI agents working on the Openwork codebase.

## Project Overview

Openwork is a Claude Cowork-like application powered by OpenCode. It consists of:
- **ui/** - React frontend (Vite + TypeScript + Tailwind)
- **bridge/** - Express proxy server (TypeScript + Node.js)

The architecture: Browser → Bridge Server (localhost:3001) → OpenCode Server (localhost:4096)

## Build & Development Commands

### Root Level (npm workspaces)
```bash
npm install              # Install all dependencies
npm run dev              # Start bridge + UI concurrently
npm run dev:ui           # Start UI only (localhost:5173)
npm run dev:bridge       # Start bridge only (localhost:3001)
npm run dev:opencode     # Start OpenCode server (localhost:4096)
npm run build            # Build all workspaces
npm run clean            # Remove all node_modules and dist
```

### UI Package (ui/)
```bash
npm run dev --workspace=ui       # Vite dev server
npm run build --workspace=ui     # TypeScript check + Vite build
npm run preview --workspace=ui   # Preview production build
```

### Bridge Package (bridge/)
```bash
npm run dev --workspace=bridge   # tsx watch mode
npm run build --workspace=bridge # TypeScript compile
npm run start --workspace=bridge # Run compiled dist/server.js
```

### Type Checking
```bash
cd ui && npx tsc --noEmit        # Check UI types
cd bridge && npx tsc --noEmit    # Check bridge types
```

Note: This project does not currently have tests configured. When adding tests, use Vitest for the UI and Jest/Vitest for the bridge.

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2020
- Module: ESNext with bundler resolution
- UI uses path alias: `@/*` → `./src/*`
- Bridge uses `.js` extensions in imports (ESM requirement)

### Import Order
Organize imports in this order, separated by blank lines:
1. External packages (react, express, lucide-react)
2. Internal aliases (@/components, @/hooks, @/lib)
3. Relative imports (./Component, ../utils)
4. Type-only imports (use `import type` when importing only types)

```typescript
// Example - UI component
import { useState, useCallback } from 'react'
import { Bolt, Info } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSessions } from '@/hooks/useSessions'

import { WelcomeTiles } from './WelcomeTiles'
import type { Task, Step, AgentMode } from '@/types'
```

```typescript
// Example - Bridge server
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { healthRouter } from './routes/health.js'
import { opencodeRouter } from './routes/opencode.js'
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskList`, `AppHeader` |
| Hooks | camelCase with `use` prefix | `useSessions`, `useSSE` |
| Types/Interfaces | PascalCase | `Task`, `StepStatus` |
| Type aliases | PascalCase | `AgentMode` |
| Functions | camelCase | `formatRelative`, `handleSend` |
| Constants | UPPER_SNAKE_CASE | `API_BASE`, `PORT` |
| Files - Components | PascalCase.tsx | `Canvas.tsx`, `Button.tsx` |
| Files - Hooks/Utils | camelCase.ts | `useSessions.ts`, `utils.ts` |
| CSS classes | Tailwind utility classes | No custom CSS class names |

### Error Handling

**API Client (UI)**
- Use custom `ApiError` class with status code and error code
- Handle errors in hooks, expose via `error` state
- Use `err instanceof Error ? err.message : 'fallback'` pattern

**Bridge Server**
- Use Express error middleware
- Return JSON: `{ error: string, code: string }`
- Log errors with `console.error`

### Tailwind CSS Guidelines
- Use Tailwind utility classes exclusively (no custom CSS)
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Prefer neutral color palette (neutral-50, neutral-900, etc.)
- Standard spacing: rounded-xl/2xl, p-3/4/6, gap-2/3/4
- Use semantic variants: text-green-600, text-amber-600, text-red-600

### Type Definitions
- Define shared types in `ui/src/types/index.ts`
- Use `type` for unions/aliases, `interface` for object shapes
- Export transform functions alongside types when needed
- Use optional properties (`?`) rather than `| undefined`

## Project-Specific Patterns

### API Layer (ui/src/lib/api/)
- One file per resource domain (sessions.ts, files.ts, health.ts)
- Use generic client functions: `get<T>`, `post<T>`, `patch<T>`, `del<T>`
- Return typed promises, let hooks handle state

### Custom Hooks (ui/src/hooks/)
- One hook per feature/resource
- Return object with: data, loading, error, action methods
- Use `useCallback` for memoized async functions
- Handle SSE connections in dedicated `useSSE` hook

### Bridge Routes (bridge/src/routes/)
- Use Express Router
- Export as `<name>Router`
- Proxy OpenCode endpoints without transformation
- Handle SSE streaming specially (no buffering)

### Component Organization
```
components/
├── ui/          # Base components (Button, Card, Input)
├── layout/      # App structure (AppHeader, Sidebar)
├── canvas/      # Main workspace (Canvas, Composer, StepsPanel)
├── inspector/   # Right panel (Inspector, ArtifactsCard)
└── tasks/       # Task management (TaskList, TaskItem)
```

## Environment Variables

**bridge/.env**
```env
OPENCODE_BASE_URL=http://127.0.0.1:4096
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=
PORT=3001
```

Never commit `.env` files. Use `.env.example` as template.
