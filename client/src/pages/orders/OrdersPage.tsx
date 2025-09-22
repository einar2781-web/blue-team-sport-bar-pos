import React from 'react'
import { Receipt } from 'lucide-react'

const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Órdenes
      </h1>
      
      <div className="card p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay órdenes</h3>
          <p>Las órdenes aparecerán aquí cuando se realicen ventas.</p>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage