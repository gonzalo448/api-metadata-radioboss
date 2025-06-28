import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors({ origin: '*' }));

// Ruta principal de metadatos
app.get('/api/now-playing', async (req, res) => {
  try {
    const radiobossUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=playbackinfo';
    const imageUrl = 'https://api-metadata-radioboss.vercel.app/api/trackart'; // Ahora apuntamos a la nueva ruta
    const streamUrl = 'https://ritmo.moxapps.shop/stream';

    console.log('📡 Conectando a:', radiobossUrl);

    const response = await fetch(radiobossUrl);

    if (!response.ok) {
      throw new Error(`❌ Respuesta HTTP no válida: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('📨 XML recibido (fragmento):', xmlText.slice(0, 200), '...');

    const result = await parseStringPromise(xmlText, { explicitArray: false });
    console.log('🎯 TRACK completo:', result?.Info?.CurrentTrack?.TRACK);

    const track = result?.Info?.CurrentTrack?.TRACK;

    if (!track) {
      throw new Error('❌ No se encontró el nodo TRACK dentro de CurrentTrack.');
    }

    const artista = track.$?.ARTIST || 'Desconocido';
    const titulo = track.$?.TITLE || 'Sin título';

    res.json({
      artista,
      titulo,
      caratula: imageUrl,
      stream: streamUrl
    });

  } catch (error) {
    console.error('🚨 Error al obtener metadatos:', error.message);
    res.status(500).json({ error: 'Error al obtener metadatos' });
  }
});

// Ruta nueva para redirigir imagen
app.get('/api/trackart', async (req, res) => {
  try {
    const imageResponse = await fetch('https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=trackartwork');

    if (!imageResponse.ok) {
      throw new Error('❌ No se pudo obtener la imagen');
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(imageBuffer));
  } catch (err) {
    console.error('🚨 Error al redirigir imagen:', err.message);
    res.status(500).send('Error al redirigir imagen');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}/api/now-playing`);
});
