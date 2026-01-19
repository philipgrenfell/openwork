# Openwork

A Claude Cowork-inspired application powered by OpenCode - bringing AI-assisted task management to your local environment.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Bridge    │────────▶│  OpenCode   │
│  (React UI) │  HTTP   │   Server    │  HTTP   │   Server    │
│             │◀────────│  (Express)  │◀────────│  (Local)    │
└─────────────┘   SSE   └─────────────┘   SSE   └─────────────┘
  localhost:5173         localhost:3001          localhost:4096
```

## Quick Start

### Prerequisites

1. **Node.js 18+** 
2. **OpenCode** installed:
   ```bash
   npm install -g opencode-ai
   # or
   curl -fsSL https://opencode.ai/install | bash
   ```

### Installation

```bash
# Install dependencies
npm install

# Copy environment example
cp bridge/.env.example bridge/.env
```

### Running

**Terminal 1: Start OpenCode**
```bash
npm run dev:opencode
# or manually: opencode serve --port 4096 --hostname 127.0.0.1
```

**Terminal 2: Start the app**
```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
openwork/
├── ui/                         # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/        # Main workspace components
│   │   │   ├── inspector/     # Right panel components  
│   │   │   ├── layout/        # Header, sidebar
│   │   │   ├── tasks/         # Task list components
│   │   │   └── ui/            # Base UI components
│   │   ├── hooks/             # React hooks for API integration
│   │   ├── lib/api/           # API client functions
│   │   └── types/             # TypeScript types
│   └── package.json
├── bridge/                     # Express proxy server
│   ├── src/
│   │   ├── routes/            # API routes
│   │   └── utils/             # OpenCode client utilities
│   └── package.json
└── package.json                # Workspace root
```

## Features

- **Task Management**: Create and manage tasks/sessions
- **Plan/Build Modes**: Toggle between planning and execution
- **Steps Timeline**: Real-time progress tracking
- **Artifacts Panel**: View files created during tasks
- **SSE Updates**: Live updates via Server-Sent Events
- **Connection Status**: Visual indicator for OpenCode connection

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start bridge + UI |
| `npm run dev:ui` | Start UI only |
| `npm run dev:bridge` | Start bridge only |
| `npm run dev:opencode` | Start OpenCode server |
| `npm run build` | Build for production |

## Environment Variables

**bridge/.env**
```env
OPENCODE_BASE_URL=http://127.0.0.1:4096
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=          # Optional
PORT=3001
```

## API Endpoints

The bridge proxies these OpenCode endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Check bridge + OpenCode status |
| `GET /api/opencode/session` | List sessions |
| `POST /api/opencode/session` | Create session |
| `GET /api/opencode/session/:id/message` | Get messages |
| `POST /api/opencode/session/:id/message` | Send message |
| `GET /api/opencode/file/status` | Get tracked files |
| `GET /api/opencode/event` | SSE event stream |

## Next Steps

To extend this project:

1. **Enhance steps parsing** - Parse tool calls into detailed substeps
2. **Add file preview** - Show file content in artifacts panel
3. **Session persistence** - Remember selected task across reloads
4. **Error toasts** - Better error feedback with toast notifications
5. **Dark mode** - Add theme toggle
6. **Keyboard shortcuts** - Add more keyboard navigation

## License

MIT
