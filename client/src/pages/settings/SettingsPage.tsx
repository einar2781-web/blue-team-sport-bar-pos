import React from 'react'
import { Settings, Store, Users, CreditCard, Bell, Shield } from 'lucide-react'

const settingsSections = [
  {
    title: 'Restaurante',
    description: 'Información general del restaurante',
    icon: Store,
    items: ['Nombre y descripción', 'Dirección y contacto', 'Horarios de operación']
  },
  {
    title: 'Usuarios y Roles',
    description: 'Gestión de empleados y permisos',
    icon: Users,
    items: ['Lista de empleados', 'Roles y permisos', 'Configuración de acceso']
  },
  {
    title: 'Pagos',
    description: 'Métodos de pago y facturación',
    icon: CreditCard,
    items: ['Métodos de pago', 'Configuración fiscal', 'Impuestos']
  },
  {
    title: 'Notificaciones',
    description: 'Alertas y notificaciones',
    icon: Bell,
    items: ['Alertas de inventario', 'Notificaciones push', 'Emails automáticos']
  },
  {
    title: 'Seguridad',
    description: 'Configuración de seguridad',
    icon: Shield,
    items: ['Cambiar contraseña', 'Autenticación', 'Logs de actividad']
  }
]

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Configuración
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="card card-hover p-6 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {section.description}
              </p>
              
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      
      <div className="card p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Configuración Avanzada</h3>
          <p>Las opciones de configuración estarán disponibles próximamente.</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage