# NexoLeal 🤝

**Motor de Lealtad y Retención para PYMES (GTM Hackathon CDMX)**

NexoLeal transforma el obsoleto sistema de tarjetas de lealtad de cartón en un ecosistema digital B2B2C. Combina un monedero digital sin fricción para el usuario final con un CRM invisible impulsado por IA para el dueño del negocio, erradicando el fraude mediante tokens criptográficos de un solo uso.

## 🚀 El Problema y la Solución (Go-To-Market)

Las PYMES (barberías, estéticas, clínicas veterinarias, etc.) sufren de tres grandes dolores en la retención de clientes:
1. **Pérdida de datos:** Las tarjetas físicas no recopilan información de contacto ni frecuencia de visita.
2. **Fraude:** Los empleados o clientes falsifican los sellos con facilidad.
3. **Falta de accionabilidad:** No hay forma automatizada de reactivar a un cliente que dejó de asistir.

**NexoLeal** resuelve esto mediante:
* **Escaneo Seguro:** Códigos QR dinámicos que caducan y evitan la duplicación de sellos.
* **Recolección Automática:** Cada escaneo es un punto de datos que alimenta el perfil del cliente.
* **Reactivación Inteligente:** Integración con Gemini API para leer la base de datos, detectar patrones de abandono y generar campañas de reactivación altamente personalizadas para días de bajas ventas.

## 🛠 Stack Tecnológico

* **Frontend:** Lovable (React + Vite + Tailwind CSS)
* **Backend & Base de Datos:** Supabase (PostgreSQL)
* **Inteligencia Artificial:** Gemini API 
* **Criptografía:** Funciones Hash para validación de tokens

## 🔒 Arquitectura de Seguridad (Motor Anti-Fraude)

Para garantizar que los tokens de lealtad no puedan ser falsificados, interceptados o reutilizados, el sistema implementa una validación criptográfica en el backend. 

La generación del token $T$ para un usuario con identificador $u$ en un tiempo $t$, utilizando la clave secreta del servidor $k$, se define formalmente como:

$$T = H(k \parallel u \parallel t)$$

Donde $H$ representa una función hash unidireccional (ej. SHA-256). La naturaleza algorítmica de $H$ hace computacionalmente inviable para un atacante invertir la función y recuperar $k$ a partir del código QR, garantizando la integridad absoluta de cada sello otorgado.

## 📂 Estructura del Proyecto

* `/frontend` - Aplicación web con tres flujos de usuario:
  * `Cliente`: Monedero digital y botón de generación de QR.
  * `Staff/Cajero`: Interfaz de cámara web para escaneo y validación.
  * `Admin`: Dashboard del dueño de la PYME (Métricas de retención y creador de campañas con IA).
* `/backend` - Configuración de Supabase, tablas (`usuarios`, `visitas`, `tokens`) y Edge Functions para Gemini.
* `/docs` - Assets, logotipos y pitch deck.
