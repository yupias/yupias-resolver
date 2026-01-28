/* YUPIAS RESOLVER - PROXY EDITION */
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;

// Leemos el proxy de las variables de entorno de Coolify
const PROXY_URL = process.env.HTTP_PROXY; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        service: 'yupias-resolver', 
        status: 'alive', 
        proxy_configured: !!PROXY_URL // Nos dice si hay proxy activo o no
    });
});

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    console.log(`🔍 Procesando: ${videoUrl}`);

    // Construimos el comando base
    let cmd = `yt-dlp -j --no-playlist --socket-timeout 15`;

    // 🛡️ SI HAY PROXY, LO USAMOS
    if (PROXY_URL) {
        console.log("🛡️ Usando Proxy para la petición");
        cmd += ` --proxy "${PROXY_URL}"`;
    }

    // Añadimos la URL al final
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return res.status(500).json({ 
                error: 'Error extrayendo metadatos', 
                details: stderr || error.message,
                is_ip_blocked: stderr.includes("blocked") || stderr.includes("429")
            });
        }

        try {
            const rawData = JSON.parse(stdout);
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
            res.status(500).json({ error: 'Error parseando respuesta' });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver listo en puerto ${PORT}`);
});
