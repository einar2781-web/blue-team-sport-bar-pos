# 🏆 Blue Team Sport Bar POS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.9-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.3-blue.svg)](https://tailwindcss.com/)

## 🌟 Descripción

Sistema de Punto de Venta completo para **Blue Team Sport Bar** - Una aplicación web moderna desarrollada con React, TypeScript y Vite para la gestión integral de ventas, inventario, órdenes y clientes en un ambiente deportivo.

## 🚀 Demo y URLs

- **🌐 Aplicación en Vivo**: [https://pos.chapibot.pro](https://pos.chapibot.pro)
- **📱 PWA**: Instalable como app nativa
- **🔐 Credenciales Demo**: `demo@blueteam.com` / `password123`

## 🌟 Características Principales

### 💼 Gestión Integral
- **Sistema POS Completo** - Procesamiento rápido de órdenes
- **Gestión de Inventario** - Control de stock en tiempo real
- **Administración de Mesas** - Layout visual del restaurant
- **Base de Clientes** - Historial y preferencias
- **Reportes Avanzados** - Analytics y métricas

### 🎨 Experiencia de Usuario
- **PWA (Progressive Web App)** - Funciona offline
- **Responsive Design** - Adaptable a todos los dispositivos  
- **Modo Oscuro/Claro** - Tema personalizable
- **Interface Moderna** - Diseño intuitivo y rápido
- **Accesibilidad** - Cumple estándares WCAG

### ⚡ Tecnología Moderna
- **React 18** con Hooks y Context API
- **TypeScript** para tipado fuerte
- **Vite** para desarrollo ultrarrápido
- **Tailwind CSS** para estilos utilitarios
- **Lucide React** para iconografía
- **React Router** para navegación

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/einar2781-web/blue-team-sport-bar-pos.git

# Navegar al directorio del cliente
cd blue-team-sport-bar-pos/client

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run preview  # Preview del build
```

## 🌐 Despliegue en Producción

### Build de Producción
```bash
cd client
npm run build
# Archivos generados en ./dist/
```

### Despliegue Automatizado
```powershell
# Script incluido para Windows
.\client\deploy-to-vps.ps1
```

### Configuración VPS Ubuntu
```bash
# SSL con Let's Encrypt
sudo certbot --nginx -d pos.chapibot.pro

# Configurar Nginx
sudo nano /etc/nginx/sites-available/pos.chapibot.pro

# Permisos correctos
sudo chown -R www-data:www-data /var/www/pos.chapibot.pro
sudo chmod -R 755 /var/www/pos.chapibot.pro
```

## 🏗️ Arquitectura del Proyecto

```
blue-team-sport-bar-pos/
├── client/                 # Frontend React
│   ├── public/            # Assets estáticos
│   │   ├── logo.svg       # Logo Blue Team
│   │   ├── favicon.svg    # Favicon
│   │   └── manifest.json  # PWA manifest
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   ├── providers/     # Context providers
│   │   └── styles/        # Estilos globales
│   └── dist/              # Build de producción
├── server/                # Backend Node.js (futuro)
├── database/              # Scripts SQL
└── docs/                  # Documentación
```

## 🎨 Tema y Branding

### 🏆 **Blue Team Sport Bar**
- **Logo**: Escudo deportivo con trofeo dorado y balón de fútbol
- **Temática**: Sport bar con ambiente deportivo
- **Colores principales**:
  - Azul primario: `#1e3a8a`
  - Azul secundario: `#3b82f6`
  - Dorado: `#fbbf24`
  - Naranja: `#f97316`

## 📱 PWA - Aplicación Web Progresiva

Blue Team Sport Bar POS es una PWA completa:

- ✅ **Instalable** - Se instala como app nativa
- ✅ **Offline** - Funciona sin internet
- ✅ **Responsive** - Para móvil, tablet y desktop
- ✅ **Rápida** - Carga instantánea
- ✅ **Segura** - HTTPS requerido

## 📊 Funcionalidades del Sistema

### 🛒 **Punto de Venta (POS)**
- Interfaz táctil optimizada
- Catálogo de productos visual
- Cálculo automático de totales
- Múltiples métodos de pago
- Impresión de tickets

### 📦 **Gestión de Inventario**
- Control de stock en tiempo real
- Categorías de productos
- Alertas de stock bajo
- Reportes de inventario
- Gestión de proveedores

### 🏠 **Administración de Mesas**
- Layout visual del restaurante
- Estados en tiempo real
- Asignación de órdenes
- Control de ocupación
- Sistema de reservas

### 👥 **Gestión de Clientes**
- Base de datos completa
- Historial de compras
- Preferencias personalizadas
- Programas de lealtad
- Análisis de comportamiento

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# .env.local
VITE_API_URL=https://api.chapibot.pro
VITE_APP_NAME="Blue Team Sport Bar POS"
VITE_APP_VERSION=1.0.0
```

### Configuración de Desarrollo
- **Puerto desarrollo**: 3000
- **Puerto producción**: 443 (HTTPS)
- **Base de datos**: PostgreSQL (futuro)
- **Cache**: Redis (futuro)

## 📈 Roadmap

### ✅ Versión 1.0 (Actual)
- [x] Sistema POS básico
- [x] Gestión de productos
- [x] PWA completa
- [x] Tema Blue Team Sport Bar
- [x] Deploy en producción

### 🚧 Versión 1.1 (En desarrollo)
- [ ] Backend completo con API
- [ ] Base de datos PostgreSQL
- [ ] Sistema de usuarios y roles
- [ ] Reportes avanzados
- [ ] Integración con impresoras

### 🔮 Versión 2.0 (Futuro)
- [ ] App móvil nativa
- [ ] Integración con delivery
- [ ] Sistema de reservas online
- [ ] Analytics avanzados
- [ ] Integraciones de pago

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📞 Soporte y Contacto

- **Email**: einar2781.web@gmail.com
- **GitHub**: [@einar2781-web](https://github.com/einar2781-web)
- **Issues**: [GitHub Issues](https://github.com/einar2781-web/blue-team-sport-bar-pos/issues)

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

## 🙏 Agradecimientos

- [React](https://reactjs.org/) - Framework principal
- [Vite](https://vitejs.dev/) - Build tool ultrarrápido
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide React](https://lucide.dev/) - Iconografía
- [Vercel](https://vercel.com/) - Inspiración para PWA

---

<div align="center">
  <strong>🏆 Blue Team Sport Bar POS - Desarrollado con ❤️ y ⚽</strong><br/>
  <em>Sistema POS moderno para el deporte y la gastronomía</em>
</div>