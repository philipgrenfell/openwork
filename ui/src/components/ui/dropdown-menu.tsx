import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({ 
  children, 
  asChild 
}: { 
  children: React.ReactNode
  asChild?: boolean 
}) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  
  const handleClick = () => context.setOpen(!context.open)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    })
  }
  
  return <button onClick={handleClick}>{children}</button>
}

function DropdownMenuContent({ 
  children, 
  align = 'start',
  className,
}: { 
  children: React.ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu')
  
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context.setOpen(false)
      }
    }
    
    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [context.open, context])
  
  if (!context.open) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 min-w-[8rem] rounded-xl border border-neutral-200 bg-white p-1 shadow-lg',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold text-neutral-900', className)}>
      {children}
    </div>
  )
}

function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-neutral-200" />
}

function DropdownMenuItem({ 
  children, 
  onClick,
  disabled,
  className,
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const context = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    if (!disabled) {
      onClick?.()
      context?.setOpen(false)
    }
  }
  
  return (
    <button
      className={cn(
        'flex w-full items-center rounded-lg px-2 py-1.5 text-sm',
        'hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
}
