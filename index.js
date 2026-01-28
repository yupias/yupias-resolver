/* YUPIAS RESOLVER - HYBRID v3.1 (Fixed) */
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
    res.json({ service: 'yupias-resolver', version: '3.1 (Hybrid)', status: 'alive' });
});

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    const tempId = Date.now().toString();
    const tempPath = path.join('/tmp', tempId);

    console.log(`🔍 Procesando v3.1: ${videoUrl}`);

    // Comando COMPLETO: Metadata + Subs
    let cmd = `yt-dlp -j --write-auto-sub --sub-lang "es.*,en.*,lat.*" --skip-download --output "${tempPath}" --socket-timeout 30`;

    if (PROXY_URL) cmd += ` --proxy "${PROXY_URL}"`;
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error && !stdout) { // Si falla y no hay JSON, error fatal
            return res.status(500).json({ error: 'Error motor', details: stderr || error.message });
        }

        let data = {};
        try {
            data = JSON.parse(stdout);
        } catch (e) {
            // A veces yt-dlp escupe warnings antes del JSON, intentamos limpiarlo
            const jsonStart = stdout.indexOf('{');
            if (jsonStart > -1) {
                try {
                    data = JSON.parse(stdout.substring(jsonStart));
                } catch (e2) { return res.status(500).json({ error: 'JSON corrupto' }); }
            } else {
                return res.status(500).json({ error: 'No se recibió JSON válido' });
            }
        }

        // --- LECTURA DE TRANSCRIPT ---
        let transcript = "";
        try {
            if (fs.existsSync('/tmp')) {
                const dirFiles = fs.readdirSync('/tmp');
                const subFile = dirFiles.find(f => f.startsWith(tempId) && f.endsWith('.vtt'));
                if (subFile) {
                    const fullPath = path.join('/tmp', subFile);
                    const rawSubs = fs.readFileSync(fullPath, 'utf-8');
                    transcript = rawSubs
                        .replace(/WEBVTT[\s\S]*?(\n\n|$)/g, '')
                        .replace(/^\d{2}:\d{2}.*$/gm, '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/^\s*[\r\n]/gm, '')
                        .split('\n').join(' ');
                    fs.unlinkSync(fullPath);
                }
            }
        } catch (err) { console.error("Error subs:", err); }

        // --- DATOS COMPLETOS (Recuperamos lo perdido) ---
        const cleanData = {
            platform: data.extractor,
            id: data.id,
            title: data.title,
            description: data.description || "",
            transcript: transcript.substring(0, 5000) || "No disponible",
            
            // Metadatos ricos
            tags: data.tags || [],
            categories: data.categories || [],
            
            // Métricas
            views: data.view_count,
            likes: data.like_count,
            comments: data.comment_count,
            shares: data.repost_count,
            duration: data.duration,
            
            // Audio (Recuperado)
            audio_track: data.track,
            audio_artist: data.artist,

            upload_date: data.upload_date,
            thumbnail: data.thumbnail,
            url: data.webpage_url
        };

        res.json({ success: true, data: cleanData });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Yupias Resolver v3.1 listo en ${PORT}`);
});
