import React from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Clock } from 'lucide-react'

const stats = [
  {
    name: 'Ventas de Hoy',
    value: '$12,450',
    change: '+12%',
    changeType: 'positive',
    icon: DollarSign,
  },
  {
    name: 'Órdenes Activas',
    value: '23',
    change: '+5',
    changeType: 'positive',
    icon: ShoppingCart,
  },
  {
    name: 'Clientes Atendidos',
    value: '156',
    change: '+8%',
    changeType: 'positive',
    icon: Users,
  },
  {
    name: 'Tiempo Promedio',
    value: '12 min',
    change: '-2 min',
    changeType: 'positive',
    icon: Clock,
  },
]

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Bienvenido de vuelta!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Aquí tienes un resumen de Blue Team Sport Bar hoy.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.name}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {item.value}
                    </p>
                    <p className={`ml-2 text-sm font-medium ${
                      item.changeType === 'positive' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {item.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Órdenes Recientes
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { order: '#1234', table: 'Mesa 5', amount: '$85.50', status: 'En preparación' },
              { order: '#1235', table: 'Mesa 2', amount: '$42.30', status: 'Listo' },
              { order: '#1236', table: 'Para llevar', amount: '$28.90', status: 'Pagado' },
            ].map((order) => (
              <div key={order.order} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{order.order}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.table}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{order.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'Listo' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : order.status === 'Pagado'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Productos Populares
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Hamburguesa Clásica', sold: '24 vendidas', trend: '+15%' },
              { name: 'Pizza Margherita', sold: '18 vendidas', trend: '+8%' },
              { name: 'Ensalada César', sold: '16 vendidas', trend: '+12%' },
            ].map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <span className="flex-shrink-0 h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                    {index + 1}
                  </span>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.sold}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {product.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage