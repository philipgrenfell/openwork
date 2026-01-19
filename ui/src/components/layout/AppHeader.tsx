import { Zap, Wifi, WifiOff } from 'lucide-react'
import { useOpenCodeConnection } from '@/hooks/useOpenCodeConnection'

export function AppHeader() {
  const { health, isConnected, version, loading } = useOpenCodeConnection()
  const bridgeOnline = health?.bridge.status === 'ok'
  const opencodeOnline = health?.opencode.status === 'ok'
  
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-[#f8f5f0]/80 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#d98c6c] text-white flex items-center justify-center shadow-sm">
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-base font-semibold tracking-tight">Openwork</div>
        </div>
        
        <div className="text-xs text-neutral-400">
          Powered by OpenCode
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <div className="text-xs text-neutral-400">Checking connection...</div>
          ) : !bridgeOnline ? (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Bridge offline</span>
            </div>
          ) : !opencodeOnline ? (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <WifiOff className="h-3.5 w-3.5" />
              <span>OpenCode offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Wifi className="h-3.5 w-3.5" />
              <span>Connected{version ? ` (v${version})` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
