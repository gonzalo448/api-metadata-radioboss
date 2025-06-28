import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const app = express();
const PORT = process.env.PORT || 3030;

// Permitir CORS desde cualquier origen
app.use(cors({ origin: '*' }));

// Ruta de metadatos
app.get('/api/now-playing', async (req, res) => {
  try {
    const radiobossUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=playbackinfo';
    const streamUrl = 'https://ritmo.moxapps.shop/stream'; // Stream actualizado
    const coverProxyUrl = `https://${req.headers.host}/api/cover`; // Usamos esta API como proxy

    console.log('📡 Conectando a:', radiobossUrl);
    const response = await fetch(radiobossUrl);

    if (!response.ok) {
      throw new Error(`❌ Respuesta HTTP no válida: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('📨 XML recibido (fragmento):', xmlText.slice(0, 200), '...');

    const result = await parseStringPromise(xmlText, { explicitArray: false });
    const track = result?.Info?.CurrentTrack?.TRACK;

    if (!track || !track.$) {
      throw new Error('❌ No se encontró el nodo TRACK dentro de CurrentTrack.');
    }

    const artista = track.$.ARTIST || 'Desconocido';
    const titulo = track.$.TITLE || 'Sin título';

    res.json({
      artista,
      titulo,
      caratula: coverProxyUrl,
      stream: streamUrl
    });

  } catch (error) {
    console.error('🚨 Error al obtener metadatos:', error.message);
    res.status(500).json({ error: 'Error al obtener metadatos' });
  }
});

// Ruta proxy de imagen de carátula
app.get('/api/cover', async (req, res) => {
  try {
    const imageUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=trackartwork';
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error('❌ No se pudo obtener la carátula');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.buffer();

    res.setHeader('Content-Type', contentType);
    res.send(buffer);

  } catch (error) {
    console.error('🚨 Error al obtener la carátula:', error.message);
    res.status(500).send('Error al obtener carátula');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}/api/now-playing`);
});
