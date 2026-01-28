/* YUPIAS RESOLVER - GOD MODE v10 💎 */
/* Final Architecture: Robust, Clean, Scalable & Normalized */

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
        version: '10.0 (God Mode)', 
        status: 'alive'
    });
});

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    console.log(`🔍 Procesando GOD MODE: ${videoUrl}`);

    // CONFIGURACIÓN DEL MOTOR
    // --dump-single-json: Obligatorio para pureza de datos.
    // --no-warnings: Stdout limpio.
    // --flat-playlist: Si por error pasan playlist, esto lo trata rápido.
    let cmd = `yt-dlp --dump-single-json --no-warnings --skip-download --no-playlist --socket-timeout 20`;

    if (PROXY_URL) cmd += ` --proxy "${PROXY_URL}"`;
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Motor Error: ${stderr || error.message}`);
            // Devolvemos 500 pero con estructura limpia para que n8n no explote feo
            return res.status(500).json({ 
                error: 'Extractor falló', 
                details: (stderr || error.message).substring(0, 200) 
            });
        }

        try {
            const raw = JSON.parse(stdout);

            // 🔧 HELPERS DE NORMALIZACIÓN (La clave del 10/10)
            const getNum = (val) => Number.isFinite(val) ? val : null;
            const getStr = (val) => (val || "").toString().trim();
            const getPlatform = (val) => (val || "unknown").toLowerCase();

            // 💎 MODELO MAESTRO
            const cleanData = {
                // Identidad
                id: getStr(raw.id),
                title: getStr(raw.title),
                url: getStr(raw.webpage_url),
                thumbnail: getStr(raw.thumbnail),
                
                // Clasificación Precisa
                platform: getPlatform(raw.extractor_key || raw.extractor),
                type: raw.is_live ? 'live' : 'video', // Nuevo: live detection
                language: raw.language || null,

                // Contexto
                description: getStr(raw.description),
                tags: Array.isArray(raw.tags) ? raw.tags : [],
                categories: Array.isArray(raw.categories) ? raw.categories : [],
                
                // 📊 Métricas Puras (Distinguiendo 0 de NULL)
                metrics: {
                    views: getNum(raw.view_count),
                    likes: getNum(raw.like_count),
                    comments: getNum(raw.comment_count),
                    shares: getNum(raw.repost_count) 
                },
                
                // 🎵 Audio Intelligence
                audio: {
                    track: raw.track || raw.alt_title || null,
                    artist: raw.artist || raw.creator || raw.uploader || null,
                    is_trend: !!(raw.track || raw.artist)
                },

                // 👤 Creator Intelligence
                creator: {
                    name: raw.uploader || raw.channel || null,
                    id: raw.uploader_id || raw.channel_id || null,
                    url: raw.uploader_url || raw.channel_url || null,
                    subscribers: getNum(raw.channel_follower_count)
                },

                // Datos Temporales
                duration: getNum(raw.duration),
                upload_date: raw.upload_date || null,
                timestamp: getNum(raw.timestamp)
            };

            res.json({ success: true, data: cleanData });

        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            res.status(500).json({ 
                error: 'Error procesando respuesta', 
                details: 'Formato JSON inválido del motor.',
                raw_partial: stdout.substring(0, 100) 
            });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver v10 (GOD MODE) listo en ${PORT}`);
});;
