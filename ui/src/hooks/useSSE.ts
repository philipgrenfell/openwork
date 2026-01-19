import { useEffect, useRef, useCallback, useState } from 'react'

interface SSEOptions {
  onMessage?: (event: MessageEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)
  
  const connect = useCallback(() => {
    if (!url) {
      return
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    try {
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setConnected(true)
        reconnectAttemptsRef.current = 0
        options.onConnect?.()
      }
      
      eventSource.onmessage = (event) => {
        options.onMessage?.(event)
      }
      
      eventSource.onerror = (error) => {
        setConnected(false)
        options.onError?.(error)
        options.onDisconnect?.()
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (error) {
      console.error('SSE connection error:', error)
    }
  }, [url, options])
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])
  
  useEffect(() => {
    if (!url) {
      disconnect()
      return undefined
    }
    connect()
    return () => disconnect()
  }, [connect, disconnect])
  
  return {
    connected,
    reconnect: connect,
    disconnect,
  }
}
