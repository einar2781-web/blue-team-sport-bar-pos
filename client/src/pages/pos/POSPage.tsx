import React from 'react'
import { ShoppingCart, Plus } from 'lucide-react'

const products = [
  { id: 1, name: 'Hamburguesa Clásica', price: 12.99, category: 'Hamburguesas', image: '🍔' },
  { id: 2, name: 'Pizza Margherita', price: 15.99, category: 'Pizzas', image: '🍕' },
  { id: 3, name: 'Ensalada César', price: 9.99, category: 'Ensaladas', image: '🥗' },
  { id: 4, name: 'Pasta Bolognesa', price: 13.99, category: 'Pastas', image: '🍝' },
  { id: 5, name: 'Coca Cola', price: 2.99, category: 'Bebidas', image: '🥤' },
  { id: 6, name: 'Café Americano', price: 3.49, category: 'Bebidas', image: '☕' },
]

const POSPage: React.FC = () => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Products Section */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Productos
          </h2>
          <div className="flex space-x-2">
            <button className="btn btn-ghost btn-sm">Todas</button>
            <button className="btn btn-ghost btn-sm">Hamburguesas</button>
            <button className="btn btn-ghost btn-sm">Pizzas</button>
            <button className="btn btn-ghost btn-sm">Bebidas</button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card card-hover cursor-pointer p-4 text-center"
            >
              <div className="text-4xl mb-2">{product.image}</div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {product.name}
              </h3>
              <p className="text-primary-600 dark:text-primary-400 font-semibold">
                ${product.price}
              </p>
              <button className="btn btn-primary btn-sm mt-2 w-full">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Orden Actual
          </h2>
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay productos en la orden</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="text-gray-900 dark:text-white">$0.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
            <span className="text-gray-900 dark:text-white">$0.00</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="text-gray-900 dark:text-white">Total:</span>
            <span className="text-gray-900 dark:text-white">$0.00</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button className="btn btn-primary w-full" disabled>
            Procesar Pago
          </button>
          <button className="btn btn-secondary w-full" disabled>
            Guardar Orden
          </button>
        </div>
      </div>
    </div>
  )
}

export default POSPage