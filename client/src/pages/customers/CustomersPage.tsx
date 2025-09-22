import React from 'react'
import { Users } from 'lucide-react'

const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Clientes
      </h1>
      
      <div className="card p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay clientes registrados</h3>
          <p>Los clientes aparecerán aquí cuando se registren.</p>
        </div>
      </div>
    </div>
  )
}

export default CustomersPage