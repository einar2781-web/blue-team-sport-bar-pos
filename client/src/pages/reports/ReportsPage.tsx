import React from 'react'
import { BarChart3 } from 'lucide-react'

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Reportes y Analytics
      </h1>
      
      <div className="card p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Reportes disponibles próximamente</h3>
          <p>Aquí podrás ver estadísticas detalladas de ventas, productos populares y más.</p>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage