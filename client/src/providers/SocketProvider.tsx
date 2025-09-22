import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

interface SocketContextType {
  isConnected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  // Mock socket implementation for demo
  const emit = (event: string, data?: any) => {
    console.log('Socket emit:', event, data)
  }

  const on = (event: string, callback: (data: any) => void) => {
    console.log('Socket on:', event)
  }

  const off = (event: string) => {
    console.log('Socket off:', event)
  }

  useEffect(() => {
    if (user) {
      // Simulate connection
      setIsConnected(true)
    } else {
      setIsConnected(false)
    }
  }, [user])

  const value = {
    isConnected,
    emit,
    on,
    off
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}