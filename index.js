/* YUPIAS RESOLVER - INSANE MODE v3 (Subtitles) */
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const PROXY_URL = process.env.HTTP_PROXY;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        service: 'yupias-resolver', 
        version: '3.0 (Insane Mode - Subtitles)', 
        status: 'alive' 
    });
});

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    const tempId = Date.now().toString(); // ID único para archivos temporales
    const tempPath = path.join('/tmp', tempId); // Carpeta temporal

    console.log(`🔍 Procesando (Subs Mode): ${videoUrl}`);

    // COMANDO MÁGICO:
    // --write-auto-sub: Intenta bajar subtítulos generados
    // --sub-lang "es.*,en.*": Prefiere Español, luego Inglés
    // --skip-download: NO bajes el video (vital para velocidad)
    // --output: Guarda los archivos con nuestro ID temporal
    let cmd = `yt-dlp -j --write-auto-sub --sub-lang "es.*,en.*,lat.*" --skip-download --output "${tempPath}" --socket-timeout 30`;

    if (PROXY_URL) cmd += ` --proxy "${PROXY_URL}"`;
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        // Leemos el JSON principal
        let data = {};
        try {
            data = JSON.parse(stdout);
        } catch (e) {
            console.error("Error parseando JSON principal");
             if (error) return res.status(500).json({ error: error.message });
        }

        // 🕵️‍♂️ BUSCADOR DE SUBTÍTULOS
        // yt-dlp guarda los subs como "ID.es.vtt" o "ID.en.vtt"
        let transcript = "";
        try {
            const dirFiles = fs.readdirSync('/tmp');
            // Buscamos cualquier archivo que empiece por nuestro ID y termine en .vtt
            const subFile = dirFiles.find(f => f.startsWith(tempId) && f.endsWith('.vtt'));

            if (subFile) {
                console.log(`📝 Subtítulos encontrados: ${subFile}`);
                const fullPath = path.join('/tmp', subFile);
                const rawSubs = fs.readFileSync(fullPath, 'utf-8');
                
                // LIMPIEZA DE VTT (Quitar tiempos y metadatos)
                // 1. Quitar cabeceras
                // 2. Quitar lineas de tiempo (00:00:00.000 --> ...)
                // 3. Quitar etiquetas HTML (<c>, <b>)
                transcript = rawSubs
                    .replace(/WEBVTT[\s\S]*?(\n\n|$)/g, '') // Header
                    .replace(/^\d{2}:\d{2}.*$/gm, '') // Timestamps
                    .replace(/<[^>]*>/g, '') // HTML tags
                    .replace(/^\s*[\r\n]/gm, '') // Líneas vacías
                    .split('\n').join(' '); // Unir en una línea

                // Borramos el archivo
                fs.unlinkSync(fullPath);
            } else {
                console.log("⚠️ No se encontraron subtítulos (o no se pudieron descargar)");
            }
        } catch (err) {
            console.error("Error procesando subtítulos:", err);
        }

        // LIMPIEZA FINAL
        const cleanData = {
            platform: data.extractor,
            id: data.id,
            title: data.title,
            description: data.description || "",
            // ¡LA JOYA DE LA CORONA! 💎
            transcript: transcript.substring(0, 5000) || "No disponible (Audio no transcribible automáticamente)", 
            
            tags: data.tags || [],
            views: data.view_count,
            likes: data.like_count,
            comments: data.comment_count,
            shares: data.repost_count,
            duration: data.duration,
            upload_date: data.upload_date,
            thumbnail: data.thumbnail,
            url: data.webpage_url
        };

        res.json({ success: true, data: cleanData });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver v3 (INSANE) listo en ${PORT}`);
});
