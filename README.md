# GTM-Builds

Resumen corto de la idea
Problema: Marketing publica contenido “a ciegas” y ventas pierde deals en juntas internas donde el vendedor no está invitado; ese aprendizaje casi nunca regresa a marketing.

Solución:

El Publicador: transforma contenidos largos (blogs, Notion, MD) en carrousels de LinkedIn/Instagram listos para publicar, usando plantillas y colores de marca.

El Comité: genera kits para el champion (brief de negocio, tarjetas de objeciones y nota de voz) para las juntas internas de decisión.

Loop: cuando un deal se pierde por una objeción, El Comité la guarda en una “librería de objeciones” que El Publicador usa para generar nuevo contenido que la ataque desde marketing.

Agente 1: El Publicador (Marketing)
Rol
Convertir contenido largo + aprendizajes de ventas en activos de marketing listos para publicar (principalmente carrousels de LinkedIn/Instagram) sin que el marketer tenga que diseñar nada.

Inputs
Fuente de contenido:

URL de blog, página de Notion, archivo MD u otro texto largo.

Configuración de marca:

Paleta de colores, tipografía, logo y estilos predefinidos (guardados en una plantilla).

Opcional: contexto de negocio:

ICP, etapa del funnel, objetivo del post (awareness, consideración, objeción específica).

Librería de objeciones (viene de El Comité):

Lista de objeciones frecuentes (“muy caro”, “riesgos de seguridad”, “no prioridad”) con contexto y rebuttal.

Proceso interno
Análisis del texto

LLM resume el contenido en 3–4 keypoints claros y accionables.

Detecta si alguno de esos puntos puede conectar con objeciones recientes de la librería.

Diseño del carrousel

Para cada keypoint genera:

Slide con hook (línea de apertura fuerte).

Slides intermedios con explicación corta + ejemplo.

Slide final con CTA (descargar recurso, agendar demo, etc.).

Aplica plantilla visual con colores y assets de marca para que el resultado ya parezca hecho por el equipo de diseño.

Calendario & publicación

Muestra una vista previa del carrousel.

Botón “Publicar ahora” o “Programar” → envía a LinkedIn/Instagram vía Zapier/n8n.

Escribe una línea en el content planner (Notion o Google Sheet) con: título, red, fecha, estatus, origen (blog X, objeción Y).

Outputs
Carrousel listo para LinkedIn/Instagram (imágenes o HTML/CSS renderizado como PNG).

Copia del post (texto del caption + hashtags) ya generada.

Registro en el calendario de contenido, incluyendo qué objeción o aprendizaje de ventas inspiró la pieza.

Agente 2: El Comité (Ventas)
Rol
Ser el copiloto del champion para todas las juntas internas donde el vendedor no está; empaqueta el valor del deal en un kit accionable que aumenta la tasa de cierre en etapas avanzadas del pipeline.

Inputs
Información del deal (copiada desde CRM en esta primera versión):

Nombre de la cuenta, tamaño del deal, etapa, owner.

Problema de negocio, valor propuesto, producto/módulo, competidores.

Notas de discovery (bullets, transcript corto).

Stakeholders clave: cargos y áreas (CFO, VP Ops, Seguridad, etc.).

Resultado del deal (más tarde en el flujo): Won/Lost + objeción principal.

Proceso interno
Brief del champion

LLM genera un one‑pager para que el champion presente internamente, con secciones como:

Contexto: qué problema resolvemos y por qué ahora.

Impacto y ROI: 2–3 bullets con métricas.

Riesgos si no se hace nada.

Recomendación y “ask” concreto para el comité (aprobar piloto, firma, presupuesto).

Tarjetas de objeciones

A partir de la etapa del deal, industria y competidores, el agente propone 4–6 objeciones probables.

Para cada una, genera:

Formulación de la objeción en lenguaje de ejecutivo.

Respuesta corta y clara (1–2 frases).

Prueba o ejemplo (caso de cliente, métrica, quote).

Usa la librería de objeciones histórica para enriquecer y priorizar las que más han matado deals recientemente.

Nota de voz para el champion

LLM condensa el brief en un guion de 45–60 segundos.

TTS (tipo ElevenLabs) genera un audio con voz profesional que el champion puede reenviar por WhatsApp/Slack o reproducir antes de la junta.

Captura de resultado y aprendizaje

Después del resultado del deal, el AE o CSM marca en la UI:

Won / Lost.

Si es Lost, selecciona la objeción principal (o escribe una nueva) y agrega breve contexto.

El sistema guarda esto en la librería de objeciones, que alimenta tanto futuras tarjetas de objeciones como a El Publicador.

Outputs
PDF/HTML del Champion Brief listo para compartir.

Colección de tarjetas de objeciones con respuesta (en texto y/o formato que se pueda pegar en slides).

Link a la nota de voz para el champion.

Registro del deal y su objeción en la librería de aprendizaje GTM.
