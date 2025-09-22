import React from 'react'

const tables = [
  { id: 1, name: 'Mesa 1', seats: 4, status: 'available' },
  { id: 2, name: 'Mesa 2', seats: 2, status: 'occupied' },
  { id: 3, name: 'Mesa 3', seats: 6, status: 'reserved' },
  { id: 4, name: 'Mesa 4', seats: 4, status: 'available' },
  { id: 5, name: 'Mesa 5', seats: 8, status: 'occupied' },
  { id: 6, name: 'Mesa 6', seats: 2, status: 'available' },
]

const getStatusClass = (status: string) => {
  switch (status) {
    case 'available':
      return 'table-available'
    case 'occupied':
      return 'table-occupied'
    case 'reserved':
      return 'table-reserved'
    default:
      return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'available':
      return 'Disponible'
    case 'occupied':
      return 'Ocupada'
    case 'reserved':
      return 'Reservada'
    default:
      return status
  }
}

const TablesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Mesas
        </h1>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-danger-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Ocupada</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-warning-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Reservada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`table-item ${getStatusClass(table.status)}`}
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">{table.name}</h3>
              <p className="text-sm opacity-75">{table.seats} personas</p>
              <span className="badge badge-sm mt-2">
                {getStatusText(table.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TablesPage