# Implementación de Generación de Tickets/Comprobantes de Pago en Blue Team Sport Bar POS

## Objetivo

Agregar un módulo a la aplicación para generar tickets o comprobantes de pago
para cada venta realizada, de modo que puedan ser descargados como PDF o
enviados a impresión. El módulo debe ser compatible con tablets y navegadores
web modernos.

---

## Requerimientos del Ticket

El ticket debe incluir la siguiente información:

- **Nombre del negocio:** Blue Team Sport Bar
- **Dirección:** (Puedes configurarla en una variable o archivo de
  configuración)
- **Fecha y hora de la venta**
- **Número de ticket / folio**
- **Nombre del cajero**
- **Lista de productos/servicios vendidos:**
  - Cantidad
  - Nombre del producto
  - Precio unitario
  - Importe (cantidad x precio)
- **Subtotal**
- **Impuestos (IVA, etc.)**
- **Total**
- **Forma de pago** (efectivo, tarjeta, etc.)
- **Mensaje de agradecimiento** (“¡Gracias por su compra!”)
- **(Opcional)**: Logo del negocio, QR de pago, RFC, teléfono, etc.

---

## Sugerencia de Tecnologías

- **Frontend:** React + TypeScript (ya en uso)
- **Generación de PDF:** [jsPDF](https://github.com/parallax/jsPDF) o
  [react-to-print](https://github.com/gregnb/react-to-print) para impresión
  directa.
- **Estilos:** CSS para formato de ticket (formato ticket térmico, 80mm de
  ancho).

---

## Pasos para la Implementación

### 1. Instalar dependencias para PDF/Impresión

```bash
npm install jspdf
# Opcional si prefieres impresión directa
npm install react-to-print
```

### 2. Crear un componente `TicketVenta`

- Recibe por props la información de la venta.
- Renderiza el ticket con formato limpio y compacto.

_Ejemplo de estructura:_

```jsx
<TicketVenta
  negocio="Blue Team Sport Bar"
  direccion="Av. Ejemplo #123, Ciudad"
  fechaHora="2025-09-22 12:34"
  folio="000123"
  cajero="Juan Pérez"
  productos={[
    { cantidad: 2, nombre: 'Cerveza', precio: 35 },
    { cantidad: 1, nombre: 'Pizza', precio: 120 },
  ]}
  subtotal={190}
  impuestos={30.4}
  total={220.4}
  formaPago="Tarjeta"
  mensaje="¡Gracias por su compra!"
/>
```

### 3. Agregar la funcionalidad para generar PDF

- Usar jsPDF para renderizar el ticket y permitir su descarga.
- Alternativamente, usar react-to-print para imprimir directamente desde el
  navegador o tablet.

### 4. Adaptar el UI para tablets

- El componente debe ser responsive.
- Usar CSS para asegurar que el ticket se vea bien en pantallas pequeñas.

### 5. (Opcional) Integrar con impresoras POS

- Si se requiere impresión directa en impresora térmica, verificar
  compatibilidad con el navegador y las impresoras disponibles.
- Se puede imprimir desde el navegador usando react-to-print o la función de
  imprimir del navegador.

---

## Recursos útiles

- [Documentación jsPDF](https://github.com/parallax/jsPDF)
- [Ejemplo de tickets en jsPDF (español)](https://parzibyte.me/blog/2020/03/20/generar-ticket-pdf-jspdf-javascript/)
- [react-to-print](https://github.com/gregnb/react-to-print)

---

## Ejemplo de flujo de usuario

1. El cajero finaliza una venta en el sistema.
2. Se muestra un botón: “Generar Ticket” o “Imprimir Ticket”.
3. Al hacer clic, se genera el PDF o se muestra el diálogo de impresión.
4. El ticket puede ser descargado, impreso o enviado por email al cliente.

---

## Notas

- Personaliza los datos fijos (dirección, logo, etc.) en un archivo de
  configuración o variable global.
- Si necesitas agregar QR, logo o datos fiscales, puedes usar imágenes y
  librerías generadoras de QR (ej: `qrcode.react`).

---

## Ejemplo visual del ticket

```
Blue Team Sport Bar
Av. Ejemplo #123, Ciudad

Fecha: 2025-09-22 12:34
Folio: 000123
Cajero: Juan Pérez

Cant  Producto      Unitario  Importe
2     Cerveza       $35.00    $70.00
1     Pizza         $120.00   $120.00

Subtotal:                     $190.00
IVA:                          $30.40
TOTAL:                        $220.40

Forma de pago: Tarjeta

¡Gracias por su compra!
```

---

## Contacto

Si tienes dudas o necesitas ayuda, contacta a @einar2781-web en GitHub.
