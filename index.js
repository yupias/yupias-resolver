/* YUPIAS RESOLVER - VIP EDITION (Cookies) 🍪 */
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const PROXY_URL = process.env.HTTP_PROXY;

// 🍪 GESTIÓN DE COOKIES (Seguridad Máxima)
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
if (process.env.YOUTUBE_COOKIES) {
    // Si hay cookies en Coolify, las escribimos en un archivo oculto
    fs.writeFileSync(COOKIES_PATH, process.env.YOUTUBE_COOKIES);
    console.log("🍪 Cookies cargadas correctamente");
} else {
    console.log("⚠️ No se detectaron cookies (Modo Anónimo)");
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'alive', mode: 'VIP 🍪' }));

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    const tempId = Date.now().toString();
    const tempPath = path.join('/tmp', tempId);

    console.log(`🔍 Procesando VIP: ${videoUrl}`);

    // Añadimos --cookies al comando
    let cmd = `yt-dlp -j --write-auto-sub --sub-lang "es.*,en.*" --skip-download --output "${tempPath}" --socket-timeout 30`;
    
    // Si tenemos el archivo de cookies, lo usamos
    if (fs.existsSync(COOKIES_PATH)) {
        cmd += ` --cookies "${COOKIES_PATH}"`;
    }

    if (PROXY_URL) cmd += ` --proxy "${PROXY_URL}"`;
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error && !stdout) return res.status(500).json({ error: 'Error motor', details: stderr });

        let data = {};
        try {
            const jsonStart = stdout.indexOf('{');
            if (jsonStart > -1) data = JSON.parse(stdout.substring(jsonStart));
        } catch (e) { return res.status(500).json({ error: 'Error JSON' }); }

        // Lectura de Transcript (Igual que antes)
        let transcript = "";
        try {
            if (fs.existsSync('/tmp')) {
                const subFile = fs.readdirSync('/tmp').find(f => f.startsWith(tempId) && f.endsWith('.vtt'));
                if (subFile) {
                    const fullPath = path.join('/tmp', subFile);
                    transcript = fs.readFileSync(fullPath, 'utf-8')
                        .replace(/WEBVTT[\s\S]*?(\n\n|$)/g, '')
                        .replace(/^\d{2}:\d{2}.*$/gm, '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/^\s*[\r\n]/gm, ' ').trim();
                    fs.unlinkSync(fullPath);
                }
            }
        } catch (err) {}

        res.json({
            success: true,
            data: {
                platform: data.extractor,
                id: data.id,
                title: data.title,
                description: data.description || "",
                transcript: transcript.substring(0, 5000) || "No disponible",
                views: data.view_count,
                likes: data.like_count,
                duration: data.duration,
                channel: data.uploader,
                upload_date: data.upload_date,
                thumbnail: data.thumbnail,
                url: data.webpage_url
            }
        });
    });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🔥 Listo en ${PORT}`));
