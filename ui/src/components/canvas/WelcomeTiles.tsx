import { 
  FileText, 
  Table, 
  PencilRuler, 
  Folder, 
  ClipboardCheck, 
  Send 
} from 'lucide-react'

const tiles = [
  { title: 'Create a file', icon: FileText },
  { title: 'Crunch data', icon: Table },
  { title: 'Make a prototype', icon: PencilRuler },
  { title: 'Organize files', icon: Folder },
  { title: 'Prep for the day', icon: ClipboardCheck },
  { title: 'Send a message', icon: Send },
] as const

interface WelcomeTilesProps {
  onTileClick: (title: string) => void
}

export function WelcomeTiles({ onTileClick }: WelcomeTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <button
          key={tile.title}
          onClick={() => onTileClick(tile.title)}
          className="rounded-2xl border border-neutral-200/70 bg-white/80 hover:bg-white transition p-3 flex items-center gap-3 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.4)]"
        >
          <div className="h-10 w-10 rounded-2xl bg-[#f2ede5] flex items-center justify-center">
            <tile.icon className="h-4 w-4 text-[#a37b67]" />
          </div>
          <div className="text-sm font-semibold text-neutral-700">{tile.title}</div>
        </button>
      ))}
    </div>
  )
}
