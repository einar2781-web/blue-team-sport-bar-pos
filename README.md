# Restaurant POS Cloud ☁️🍽️

Un sistema de punto de venta avanzado para restaurantes con soporte móvil y en la nube, diseñado para superar las capacidades de Soft Restaurant Cloud.

## 🌟 Características Principales

### 📱 Interfaz Moderna y Responsive
- Diseño optimizado para tablets, móviles y desktop
- Interfaz táctil intuitiva para meseros y cajeros
- Tema claro/oscuro adaptable
- Soporte offline con sincronización automática

### 🛒 Gestión de Pedidos Avanzada
- Toma de comandas visual con categorías
- Modificadores y variantes de productos
- Instrucciones especiales por artículo
- Cálculo automático de impuestos y propinas
- División de cuentas y pagos parciales

### 🏪 Administración de Mesas
- Plano interactivo del restaurante
- Estados de mesa en tiempo real (libre/ocupada/reservada)
- Arrastrar y soltar para reorganizar
- Sistema de reservaciones integrado

### 💳 Procesamiento de Pagos
- Múltiples métodos de pago (efectivo, tarjeta, digital)
- Integración con Stripe y PayPal
- Generación automática de recibos
- Sistema de propinas flexible

### 👨‍🍳 Sistema de Cocina
- Pantalla dedicada para la cocina
- Cola de pedidos en tiempo real
- Temporizadores de preparación
- Notificaciones auditivas y visuales

### 📊 Analytics y Reportes
- Dashboard de ventas en tiempo real
- Análisis de productos más vendidos
- Reportes de personal y rendimiento
- Métricas de inventario y rotación

## 🏗️ Arquitectura del Sistema

```
restaurant-pos-cloud/
├── client/          # Frontend React/TypeScript
├── server/          # Backend Node.js/Express API
├── shared/          # Tipos y utilidades compartidas
├── database/        # Esquemas y migraciones
├── config/          # Configuraciones de desarrollo
├── docs/            # Documentación técnica
└── tests/           # Pruebas E2E e integración
```

## 🚀 Inicio Rápido

```bash
# Clonar el repositorio
git clone <repository-url>
cd restaurant-pos-cloud

# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
npm run db:migrate
npm run db:seed

# Iniciar en modo desarrollo
npm run dev

# O usar Docker
npm run docker:up
```

## 📦 Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **Socket.io Client** para tiempo real
- **React Query** para manejo de estado
- **PWA** para funcionalidad offline

### Backend
- **Node.js** con Express
- **TypeScript** para tipado fuerte
- **PostgreSQL** como base de datos principal
- **Redis** para cache y sesiones
- **Socket.io** para comunicación en tiempo real
- **JWT** para autenticación

### DevOps
- **Docker** para contenedorización
- **GitHub Actions** para CI/CD
- **Nginx** como reverse proxy
- **PM2** para gestión de procesos

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo completo (client + server)
npm run build        # Build de producción
npm run test         # Ejecutar pruebas
npm run lint         # Linter de código
npm run docker:build # Construir contenedores
npm run docker:up    # Levantar con Docker
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar con datos de ejemplo
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commitea tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.
