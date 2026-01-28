/* YUPIAS RESOLVER - EXTREME DATA EDITION v2 */
/* Esta versión extrae TODOS los metadatos posibles sin descargar el video */

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;
const PROXY_URL = process.env.HTTP_PROXY;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        service: 'yupias-resolver', 
        version: '2.0 (Extreme Data)', 
        status: 'alive', 
        proxy_configured: !!PROXY_URL 
    });
});

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    console.log(`🔍 Procesando (Full Data): ${videoUrl}`);

    // Aumentamos los límites para que quepan descripciones largas
    let cmd = `yt-dlp -j --no-playlist --socket-timeout 20`;

    if (PROXY_URL) {
        cmd += ` --proxy "${PROXY_URL}"`;
    }

    cmd += ` "${videoUrl}"`;

    // MaxBuffer aumentado a 50MB para soportar JSONs gigantes de YouTube
    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return res.status(500).json({ 
                error: 'Error extrayendo metadatos', 
                details: stderr || error.message 
            });
        }

        try {
            const rawData = JSON.parse(stdout);

            // 🧹 LIMPIEZA INTELIGENTE
            const cleanData = {
                platform: rawData.extractor,
                id: rawData.id,
                title: rawData.title,
                
                // 🧠 CONTEXTO EXTRA PARA LA IA
                description: rawData.description || "", // Descripción completa
                tags: rawData.tags || [], // Hashtags
                categories: rawData.categories || [], // Categoría (ej: Music, Gaming)
                
                // 📊 MÉTRICAS COMPLETAS
                duration: rawData.duration,
                views: rawData.view_count,
                likes: rawData.like_count,
                comments: rawData.comment_count, // Nuevo
                shares: rawData.repost_count,    // Nuevo (si existe)

                // 🎵 AUDIO INFO (Clave para detectar tendencias)
                audio_track: rawData.track,
                audio_artist: rawData.artist,

                // 📅 FECHAS
                upload_date: rawData.upload_date,
                
                // 🖼️ MEDIA
                thumbnail: rawData.thumbnail,
                url: rawData.webpage_url,
                download_url: rawData.url || null
            };

            res.json({ success: true, data: cleanData });

        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            res.status(500).json({ error: 'Error procesando respuesta del motor' });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver v2 listo en puerto ${PORT}`);
});
