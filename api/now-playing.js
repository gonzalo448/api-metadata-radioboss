import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors({ origin: '*' }));

app.get('/api/now-playing', async (req, res) => {
  try {
    const radiobossUrl = 'https://ritmoboss.moxapps.shop/?pass=moxradioserver&action=playbackinfo';
    const imageUrl = 'https://via.placeholder.com/300x300.png?text=Caratula'; // Imagen temporal válida
    const streamUrl = 'https://ritmo.moxapps.shop/stream'; // Tu stream real

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

app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}/api/now-playing`);
});
