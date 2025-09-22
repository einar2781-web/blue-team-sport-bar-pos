import React from 'react'

// Simple notification provider for demo
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const useNotification = () => {
  return {
    addNotification: (notification: any) => console.log('Notification:', notification),
    removeNotification: () => {},
    notifications: []
  }
}
