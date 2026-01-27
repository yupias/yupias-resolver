/* YUPIAS RESOLVER - CORE ENGINE (FERRARI MODE) */
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// 🟢 Healthcheck
app.get('/', (req, res) => {
    res.json({ 
        service: 'yupias-resolver', 
        status: 'alive', 
        engine: 'yt-dlp (Ferrari Mode)',
        timestamp: new Date().toISOString()
    });
});

// 🧠 Endpoint Real: /resolve
app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Falta el parámetro ?url=' });
    }

    console.log(`🔍 Procesando: ${videoUrl}`);

    // Comando yt-dlp optimizado para velocidad
    const cmd = `yt-dlp -j --no-playlist --socket-timeout 15 "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error motor: ${error.message}`);
            return res.status(500).json({ 
                error: 'Error extrayendo metadatos', 
                details: stderr || error.message 
            });
        }

        try {
            const rawData = JSON.parse(stdout);
            
            // Limpieza de datos (Payload ligero)
            const cleanData = {
                platform: rawData.extractor,
                id: rawData.id,
                title: rawData.title,
                duration: rawData.duration,
                views: rawData.view_count,
                likes: rawData.like_count,
                upload_date: rawData.upload_date,
                thumbnail: rawData.thumbnail,
                url: rawData.webpage_url,
                download_url: rawData.url || null
            };

            res.json({ success: true, data: cleanData });

        } catch (parseError) {
            res.status(500).json({ error: 'Salida inválida del motor' });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver listo en puerto ${PORT}`);
});
