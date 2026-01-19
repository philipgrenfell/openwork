import { Layers, Folder, Wrench, FileCode } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ContextItem } from '@/types'

function ContextIcon({ title }: { title: string }) {
  const Icon = 
    title.toLowerCase().includes('workspace') ? Folder :
    title.toLowerCase().includes('tool') ? Wrench :
    title.toLowerCase().includes('file') ? FileCode :
    Layers
  
  return (
    <div className="h-9 w-9 rounded-xl bg-[#f2ede5] flex items-center justify-center">
      <Icon className="h-4 w-4 text-[#a37b67]" />
    </div>
  )
}

interface ContextCardProps {
  context: ContextItem[]
  isConnected: boolean
}

export function ContextCard({ context, isConnected }: ContextCardProps) {
  // Build context items dynamically based on connection state
  const contextItems: ContextItem[] = context.length > 0 ? context : [
    { 
      id: 'c1', 
      title: 'Workspace', 
      subtitle: 'Current project directory' 
    },
    { 
      id: 'c2', 
      title: 'Tools', 
      subtitle: isConnected ? 'OpenCode connected' : 'OpenCode not connected' 
    },
    { 
      id: 'c3', 
      title: 'Files in use', 
      subtitle: '0 tracked yet' 
    },
  ]
  
  return (
    <Card className="rounded-[24px] border border-neutral-200/70 bg-white/80 shadow-[0_14px_50px_-40px_rgba(0,0,0,0.45)]">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-3 text-neutral-700">Context</div>
        
        <div className="space-y-3">
          {contextItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <ContextIcon title={item.title} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-xs text-neutral-500 truncate">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-3 bg-neutral-200/60" />
        
        <div className="text-xs text-neutral-500">
          Track the tools and files in use as the task runs.
        </div>
      </CardContent>
    </Card>
  )
}
