import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function Dialog({ 
  children,
  open,
  onOpenChange,
}: { 
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  
  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])
  
  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ 
  children,
  asChild,
}: { 
  children: React.ReactNode
  asChild?: boolean
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogTrigger must be used within Dialog')
  
  const handleClick = () => context.setOpen(true)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    })
  }
  
  return <button onClick={handleClick}>{children}</button>
}

function DialogContent({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogContent must be used within Dialog')
  
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.setOpen(false)
      }
    }
    
    if (context.open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [context.open, context])
  
  if (!context.open) return null
  
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      context.setOpen(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-neutral-200/70 bg-[#fbf9f6] p-6 shadow-xl animate-[openwork-rise_0.2s_ease-out]',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col space-y-2 mb-4', className)}>
      {children}
    </div>
  )
}

function DialogTitle({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn('text-xl font-semibold tracking-tight text-neutral-900', className)}>
      {children}
    </h2>
  )
}

function DialogDescription({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-sm text-neutral-500', className)}>
      {children}
    </p>
  )
}

function DialogFooter({ 
  children,
  className,
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end gap-2 mt-6', className)}>
      {children}
    </div>
  )
}

function DialogClose({ 
  children,
  asChild,
}: { 
  children: React.ReactNode
  asChild?: boolean
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogClose must be used within Dialog')
  
  const handleClick = () => context.setOpen(false)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    })
  }
  
  return <button onClick={handleClick}>{children}</button>
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
