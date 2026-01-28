/* YUPIAS RESOLVER - ELITE EDITION (Base64 Cookies) 🍪🛡️ */
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const PROXY_URL = process.env.HTTP_PROXY;

// 🧊 DESCONGELADO DE COOKIES
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
if (process.env.YOUTUBE_COOKIES) {
    try {
        // Detectamos si es Base64 (si no tiene espacios y termina en =) o texto plano
        const isBase64 = /^[a-zA-Z0-9+/]*={0,2}$/.test(process.env.YOUTUBE_COOKIES.trim());
        const cookiesContent = isBase64 
            ? Buffer.from(process.env.YOUTUBE_COOKIES, 'base64').toString('utf-8')
            : process.env.YOUTUBE_COOKIES;
            
        fs.writeFileSync(COOKIES_PATH, cookiesContent);
        console.log("🍪 Cookies descongeladas y cargadas correctamente");
    } catch (e) {
        console.error("❌ Error cargando cookies:", e.message);
    }
} else {
    console.log("⚠️ No se detectaron cookies (Modo Anónimo)");
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'alive', mode: 'ELITE 🍪' }));

app.get('/resolve', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    const tempId = Date.now().toString();
    const tempPath = path.join('/tmp', tempId);

    console.log(`🔍 Procesando ELITE: ${videoUrl}`);

    // Comando COMPLETO: Metadata + Subs + Cookies
    let cmd = `yt-dlp -j --write-auto-sub --sub-lang "es.*,en.*,lat.*" --skip-download --output "${tempPath}" --socket-timeout 30 --js-runtimes node`;
    
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

        // Lectura de Transcript
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
