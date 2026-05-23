# NexoLeal — Integración CFDI/Factura SAT

## ¿Qué es el CFDI y por qué es relevante para NexoLeal?

El **Comprobante Fiscal Digital por Internet (CFDI)** es el estándar oficial de facturación electrónica en México, regulado por el **Servicio de Administración Tributaria (SAT)**. En su versión 4.0 — la vigente desde 2023 — cada factura emitida contiene datos estructurados y validados sobre el emisor y el receptor: nombre completo o razón social, RFC, código postal, régimen fiscal y descripción de los productos o servicios adquiridos.

Lo que hace esta información extraordinariamente valiosa para NexoLeal es que **ya existe, ya está validada por el gobierno federal y no requiere que el cliente llene ningún formulario**. Cada vez que un cliente solicita factura por un servicio en la barbería, estética o clínica veterinaria, ese CFDI emitido contiene automáticamente un perfil de cliente completo y fiscalmente verificado.

***

## El Problema que Resuelve

Hoy, las PYMES enfrentan dos dolores simultáneos al gestionar su base de clientes:

1. **Captura manual lenta y con errores**: el staff captura nombre, teléfono y correo a mano — con errores tipográficos, datos falsos o incompletos.
2. **Perfiles de cliente fragmentados**: los datos de lealtad (visitas, puntos) viven separados de los datos fiscales (nombre legal, RFC), lo que impide construir un perfil 360° del cliente.

La integración CFDI resuelve ambos problemas de un solo golpe.

***

## Cómo Funciona la Integración

### Flujo Técnico

```
Cliente solicita factura
        ↓
PYME emite CFDI 4.0 vía API (FiscalAPI, FacturAPI, Factura Digital, etc.)
        ↓
NexoLeal recibe el webhook con el XML timbrado
        ↓
Supabase Edge Function parsea los nodos del XML:
  - <Receptor Nombre="José Cruz" RFC="CURJ980101ABC" .../>
  - <Concepto Descripcion="Corte de cabello" Importe="180.00"/>
        ↓
Los datos se unen al perfil de lealtad existente (match por RFC o correo)
Si el perfil no existe, se crea automáticamente con datos validados por el SAT
```

### Campos del CFDI 4.0 Útiles para NexoLeal

| Campo CFDI | Nodo XML | Valor para NexoLeal |
|---|---|---|
| Nombre completo | `Receptor/@Nombre` | Identificar al cliente sin formulario |
| RFC | `Receptor/@Rfc` | Clave única de deduplicación del perfil |
| Código postal | `Receptor/@DomicilioFiscalReceptor` | Segmentación geográfica para campañas |
| Régimen fiscal | `Receptor/@RegimenFiscalReceptor` | Distinguir cliente persona física vs. empresa |
| Descripción del servicio | `Concepto/@Descripcion` | Historial de servicios consumidos |
| Importe | `Concepto/@Importe` | Ticket promedio y valor del cliente (LTV) |
| Fecha de emisión | `@Fecha` | Frecuencia de visita con precisión fiscal |

***

## Por Qué Es una Ventaja Competitiva Únicamente Mexicana

### La Moat Regulatoria

México es uno de los pocos países en el mundo donde **la facturación electrónica es obligatoria para prácticamente todos los contribuyentes**. Esto significa que la infraestructura de datos ya existe a nivel nacional y está mantenida por el propio gobierno. Plataformas globales como Stamp Me (Australia), Loyverse (global) o Zinrelo (EE.UU.) no tienen acceso a este flujo de datos estructurado porque en sus mercados la facturación electrónica obligatoria no existe o tiene penetración mínima.

Para replicar esta ventaja en otro país, un competidor necesitaría esperar que ese gobierno adopte facturación electrónica obligatoria — un proceso que en México tomó más de una década.

### Datos Validados vs. Datos Autodeclarados

La diferencia entre un perfil de cliente creado por el cliente llenando un formulario y uno creado a partir de un CFDI es radical:

| Fuente de datos | Calidad | Validación | Costo de captura |
|---|---|---|---|
| Formulario manual (staff) | Baja — errores frecuentes | Ninguna | Alto — tiempo del empleado |
| Formulario digital (cliente) | Media — datos falsos posibles | Ninguna | Medio — fricción del usuario |
| **CFDI timbrado por el SAT** | **Alta — fiscalmente verificado** | **SAT valida RFC en tiempo real** | **Cero — captura automática** |

### Beneficio para el Dueño de la PYME

Un perfil construido con datos CFDI permite a Gemini API hacer inferencias más precisas. Por ejemplo:

- Si el `RegimenFiscalReceptor` indica "Régimen de Incorporación Fiscal", el cliente es un trabajador independiente — probablemente más sensible al precio y con horarios más flexibles que un asalariado.
- Si el `Importe` promedio de los últimos 5 CFDIs es de $350 MXN vs. un ticket habitual de $180 MXN, el cliente está comprando servicios premium — candidato ideal para una campaña de upselling.
- Si hay un gap de 45 días entre el último CFDI y hoy, es una señal de abandono más confiable que solo contar visitas registradas en la app.

***

## Implementación Práctica en el Stack de NexoLeal

### APIs de Timbrado Disponibles en México

NexoLeal puede integrarse con cualquiera de estos PAC (Proveedores Autorizados de Certificación):

| Proveedor | URL | Características clave |
|---|---|---|
| **FiscalAPI** | fiscalapi.com | REST API, SDK Python/JS, multi-RFC, sandbox gratuito |
| **FacturAPI** | facturapi.io | Muy popular entre startups, excelente documentación, webhook nativo |
| **Factura Digital** | facturadigital.com.mx | +100M CFDIs timbrados, JSON o XML, sandbox gratuito |
| **EdiFactMx** | edifact.mx | Validación contra listas negras SAT (EFOS/EDOS), JWT auth |

### Ejemplo de Supabase Edge Function (TypeScript)

```typescript
// supabase/functions/cfdi-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { cfdi_xml, uuid } = await req.json();

  // Parsear el XML del CFDI timbrado
  const parser = new DOMParser();
  const doc = parser.parseFromString(cfdi_xml, "text/xml");
  const receptor = doc.querySelector("Receptor");
  const concepto = doc.querySelector("Concepto");

  const rfc       = receptor?.getAttribute("Rfc");
  const nombre    = receptor?.getAttribute("Nombre");
  const cp        = receptor?.getAttribute("DomicilioFiscalReceptor");
  const servicio  = concepto?.getAttribute("Descripcion");
  const importe   = parseFloat(concepto?.getAttribute("Importe") ?? "0");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Upsert: si el RFC ya existe, actualizar perfil; si no, crear uno nuevo
  const { error } = await supabase
    .from("clientes")
    .upsert({
      rfc,
      nombre,
      codigo_postal: cp,
      ultima_visita: new Date().toISOString(),
      ticket_promedio_raw: importe,
    }, { onConflict: "rfc" });

  // Registrar la visita con el detalle fiscal
  await supabase.from("visitas").insert({
    rfc_cliente: rfc,
    servicio_descripcion: servicio,
    importe,
    cfdi_uuid: uuid,
    fecha: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: !error }), { status: 200 });
});
```

***

## Casos de Uso Activados por la Integración CFDI

### 1. Onboarding Cero Fricciones
El cliente nunca necesita descargar una app ni llenar un formulario. La primera vez que pide factura, NexoLeal crea su perfil automáticamente y le envía un WhatsApp: *"Hola José, tu monedero de lealtad en [Barbería X] ya está activo. Ya tienes 1 de 10 visitas para tu corte gratis."*

### 3. Detección de LTV Real
El ticket promedio calculado desde CFDIs es más preciso que el registrado manualmente. NexoLeal puede clasificar automáticamente a los clientes en tres niveles: Bronce (< $150 ticket), Plata ($150–$300) y Oro (> $300), y personalizar las recompensas de lealtad en consecuencia.

### 4. Cumplimiento y Confianza
El dueño de la PYME tiene certeza de que cada visita registrada en NexoLeal corresponde a una transacción fiscalmente verificada — eliminando la posibilidad de que el staff selle tarjetas sin que haya ocurrido una venta real.

***

## Conclusión

La integración CFDI convierte a NexoLeal en algo fundamentalmente diferente a un simple programa de puntos digitales. Al anclar cada visita a un comprobante fiscal verificado por el SAT, NexoLeal construye el CRM de PYMES más preciso y con menor fricción de captura posible en el mercado mexicano — un activo que ningún competidor global puede replicar sin que el marco regulatorio de su propio país lo permita.
