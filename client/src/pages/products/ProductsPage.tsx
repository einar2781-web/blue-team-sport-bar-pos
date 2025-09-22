import React from 'react'
import { Package, Plus, Search, Filter } from 'lucide-react'

const ProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Productos
        </h1>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="input pl-10"
              />
            </div>
          </div>
          <button className="btn btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay productos</h3>
          <p>Comienza agregando tu primer producto al inventario.</p>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage