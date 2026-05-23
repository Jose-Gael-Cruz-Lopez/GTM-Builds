// agent.js
// Recibe datos de ventas → llama a NVIDIA NIM → devuelve reporte en texto.
// No sabe de dónde vienen los datos ni a dónde va el texto.

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const SYSTEM_PROMPT = `
Eres un analista de ventas. Recibes datos de ventas de una empresa y sus sucursales.
Devuelves un reporte en texto claro que cualquier persona pueda entender.
El reporte debe explicar qué está pasando con las ventas: tendencias, sucursales
destacadas, problemas detectados y una conclusión general.
Sin tecnicismos, sin formato especial, solo texto corrido.
`.trim();

/**
 * Genera un reporte de ventas en texto a partir de los datos recibidos.
 *
 * @param {object} salesData - Datos de ventas de la empresa y sus sucursales.
 * @returns {Promise<string>} - Reporte en texto plano.
 */
export async function generateSalesReport(salesData) {
  const response = await fetch(NIM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: JSON.stringify(salesData) },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`NIM error ${response.status}: ${err.detail ?? err.message ?? response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error("El modelo no devolvió respuesta.");

  return text;
}