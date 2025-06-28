import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export default async function handler(req, res) {
  try {
    const radiobossUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=playbackinfo';
    const imageUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=trackartwork';
    const streamUrl = 'https://mox.moxapps.shop/stream';

    console.log('📡 Conectando a:', radiobossUrl);

    const response = await fetch(radiobossUrl);

    if (!response.ok) {
      throw new Error(`❌ Respuesta HTTP no válida: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('📨 XML recibido (fragmento):', xmlText.slice(0, 200), '...');

    const result = await parseStringPromise(xmlText, { explicitArray: false });
    const track = result?.Info?.CurrentTrack?.TRACK;

    if (!track) {
      throw new Error('❌ No se encontró el nodo TRACK dentro de CurrentTrack.');
    }

    const artista = track.$?.ARTIST || 'Desconocido';
    const titulo = track.$?.TITLE || 'Sin título';

    res.status(200).json({
      artista,
      titulo,
      caratula: imageUrl,
      stream: streamUrl
    });

  } catch (error) {
    console.error('🚨 Error al obtener metadatos:', error.message);
    res.status(500).json({ error: 'Error al obtener metadatos' });
  }
}
