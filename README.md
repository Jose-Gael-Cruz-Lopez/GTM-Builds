# NexoLeal 🤝

Motor de Lealtad y Retención para PYMES

NexoLeal transforma el sistema tradicional de tarjetas de lealtad de cartón en un ecosistema digital B2B2C. Combina un monedero digital sin fricción para el cliente con un sistema de retención para el negocio, permitiendo registrar visitas, prevenir fraude y activar campañas inteligentes de reactivación.

***

## Problema

Las PYMES de servicios como barberías, estéticas, clínicas veterinarias y negocios similares enfrentan tres problemas principales en la retención de clientes:

- **Pérdida de datos**: Las tarjetas físicas no capturan información útil sobre el cliente, como frecuencia de visita o historial.
- **Fraude**: Los sellos físicos pueden falsificarse fácilmente por empleados o clientes.
- **Falta de seguimiento**: No existe una forma simple de detectar cuándo un cliente dejó de regresar ni de reactivarlo automáticamente.

El resultado es una relación transaccional y ciega con el cliente: el negocio entrega recompensas, pero no aprende nada del comportamiento de compra.

***

## Solución

NexoLeal digitaliza el programa de lealtad de una PYME con tres componentes conectados:

### 1. Monedero digital para el cliente
El cliente accede a su progreso de lealtad desde una experiencia simple y rápida. Puede ver cuántas visitas lleva, cuándo desbloquea su próxima recompensa y generar su código QR de validación.

### 2. Validación segura para staff
El personal del negocio escanea el código QR del cliente desde una interfaz de caja o recepción. Cada escaneo se valida en backend para evitar duplicaciones, reutilización de tokens o intentos de fraude.

### 3. Dashboard para el dueño del negocio
El administrador visualiza métricas clave como visitas, clientes frecuentes, clientes inactivos y campañas sugeridas. Así, NexoLeal deja de ser solo un sistema de puntos y se convierte en un motor de retención.

***

## Propuesta de valor

NexoLeal no solo reemplaza una tarjeta física: convierte cada visita en una señal de negocio.

Esto permite que una PYME:

- Registre actividad de clientes sin fricción adicional.
- Detecte abandono antes de que sea demasiado tarde.
- Lance campañas de reactivación en días de baja demanda.
- Tenga evidencia clara de qué tan efectivo es su programa de lealtad.

En lugar de depender de memoria, intuición o tarjetas selladas a mano, el negocio obtiene una base operativa para retener mejor a sus clientes.

***

## Cómo funciona

### Flujo del cliente
1. El cliente abre su monedero digital.
2. Genera un código QR temporal.
3. Presenta el QR en caja o recepción.

### Flujo del staff
1. El staff escanea el código QR.
2. El backend valida que el token sea auténtico, vigente y no reutilizado.
3. Si es válido, se registra la visita y se actualiza el progreso del cliente.

### Flujo del admin
1. El dueño del negocio entra al dashboard.
2. Visualiza métricas de retención y actividad.
3. Detecta clientes inactivos o ventanas de baja demanda.
4. Genera campañas de reactivación personalizadas.

***

## Arquitectura anti-fraude

Uno de los diferenciadores clave de NexoLeal es su sistema de validación segura para evitar sellos falsos o duplicados.

La idea es generar un token ligado al usuario y al tiempo de emisión, firmado desde el servidor. De manera conceptual, puede representarse así:

$$
T = H(k \| u \| t)
$$

Donde:

- `T` es el token generado.
- `H` es una función hash segura.
- `k` es una clave secreta del servidor.
- `u` es el identificador del usuario.
- `t` es una marca de tiempo.

Este enfoque permite que cada QR sea único, temporal y difícil de falsificar. Además, el backend puede invalidarlo después de un solo uso para bloquear ataques de replay o duplicación.

***

## Casos de uso

NexoLeal puede aplicarse fácilmente a negocios de alta recurrencia como:

- Barberías
- Estéticas
- Clínicas veterinarias
- Cafeterías
- Gimnasios boutique
- Consultorios o servicios por cita

Cualquier negocio que hoy use tarjetas físicas o promociones repetitivas puede migrar a un sistema más medible y accionable.

***

## Stack tecnológico

- **Frontend**: Lovable (React + Vite + Tailwind CSS)
- **Backend**: Cloudflare Workers o Supabase según el flujo
- **Base de datos**: Supabase / PostgreSQL o D1 según arquitectura
- **Inteligencia Artificial**: Gemini API para análisis y campañas
- **Seguridad**: generación y validación de tokens con funciones hash

***

## Estructura del proyecto

```bash
/frontend
  Cliente: monedero digital y generación de QR
  Staff: escaneo y validación
  Admin: dashboard con métricas y campañas

/backend
  APIs, validación de tokens, lógica de visitas, campañas y eventos

/docs
  assets, branding, pitch deck y documentación
```

***

## Qué hace diferente a NexoLeal

NexoLeal destaca por tres razones:

1. **Resuelve un problema real y cotidiano** en miles de PYMES que todavía operan con lealtad manual.
2. **Convierte un sistema pasivo en uno accionable**, donde cada visita genera datos útiles.
3. **Integra seguridad y retención en una sola experiencia**, en lugar de limitarse a digitalizar una tarjeta física.

No es solo una app bonita ni un demo de IA: es una herramienta para ayudar a pequeños negocios a retener clientes de forma más inteligente.

***

## Visión

La visión de NexoLeal es convertirse en la capa de lealtad digital para PYMES en Latinoamérica: una infraestructura sencilla, segura y accesible que permita a pequeños negocios conocer mejor a sus clientes, aumentar recurrencia y crecer con datos reales en lugar de intuición.
