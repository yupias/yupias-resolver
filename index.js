/* YUPIAS RESOLVER - HYBRID FERRARI v11 🏎️⚡ */
/* Architecture: TikTok (yt-dlp) + YouTube (Official API) */

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
        version: '11.0 (Hybrid Ferrari)', 
        status: 'alive'
    });
});

// NÓTESE EL "async" QUE HEMOS AÑADIDO AQUÍ 👇
app.get('/resolve', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'Falta ?url=' });

    console.log(`🔍 Procesando HYBRID: ${videoUrl}`);

    // 🟥 BLOQUE YOUTUBE (API OFICIAL)
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        try {
            console.log("🔴 Modo YouTube API activado");
            
            const videoIdMatch = videoUrl.match(/(v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (!videoIdMatch) {
                return res.status(400).json({ error: 'No se pudo extraer ID de YouTube' });
            }

            const videoId = videoIdMatch[2];
            const apiKey = process.env.YOUTUBE_API_KEY;

            if (!apiKey) {
                console.error("❌ Falta API Key");
                return res.status(500).json({ error: 'Server Config Error: YOUTUBE_API_KEY missing' });
            }

            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
            const ytRes = await fetch(apiUrl);
            
            if (!ytRes.ok) {
                const errText = await ytRes.text();
                throw new Error(`YouTube API Error: ${ytRes.status} - ${errText}`);
            }

            const ytData = await ytRes.json();

            if (!ytData.items || !ytData.items.length) {
                return res.status(404).json({ error: 'Video no encontrado en YouTube (o es privado)' });
            }

            const v = ytData.items[0];

            // Mapping para que sea IDÉNTICO al modelo del Ferrari v10
            const cleanData = {
                id: videoId,
                title: v.snippet.title,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || null,

                platform: 'youtube',
                type: 'video', // API no distingue fácilmente lives pasados
                language: v.snippet.defaultAudioLanguage || null,

                description: v.snippet.description || "",
                tags: v.snippet.tags || [],
                categories: [], // Requiere otra llamada a la API, lo dejamos vacío por eficiencia

                metrics: {
                    views: Number(v.statistics.viewCount) || 0,
                    likes: Number(v.statistics.likeCount) || 0,
                    comments: Number(v.statistics.commentCount) || 0,
                    shares: null // YouTube API no da shares públicamente
                },

                audio: {
                    track: null,
                    artist: null,
                    is_trend: false
                },

                creator: {
                    name: v.snippet.channelTitle,
                    id: v.snippet.channelId,
                    url: `https://www.youtube.com/channel/${v.snippet.channelId}`,
                    subscribers: null // Requiere llamada extra a channels API
                },

                duration: v.contentDetails.duration, // Formato ISO 8601 (PT4M13S) - Ojo, n8n puede necesitar parsearlo
                upload_date: v.snippet.publishedAt,
                timestamp: null
            };

            return res.json({ success: true, data: cleanData });

        } catch (err) {
            console.error('❌ YouTube API Error:', err);
            return res.status(500).json({ error: 'Error YouTube API', details: err.message });
        }
    }

    // ⬛ BLOQUE TIKTOK / OTROS (GOD MODE v10 - MOTOR yt-dlp)
    // Si no es YouTube, seguimos con el plan original inalterado.
    
    // --dump-single-json: Obligatorio para pureza de datos.
    // --no-warnings: Stdout limpio.
    let cmd = `yt-dlp --dump-single-json --no-warnings --skip-download --no-playlist --socket-timeout 20`;

    if (PROXY_URL) cmd += ` --proxy "${PROXY_URL}"`;
    cmd += ` "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Motor Error: ${stderr || error.message}`);
            return res.status(500).json({ 
                error: 'Extractor falló', 
                details: (stderr || error.message).substring(0, 200) 
            });
        }

        try {
            const raw = JSON.parse(stdout);

            const getNum = (val) => Number.isFinite(val) ? val : null;
            const getStr = (val) => (val || "").toString().trim();
            const getPlatform = (val) => (val || "unknown").toLowerCase();

            const cleanData = {
                id: getStr(raw.id),
                title: getStr(raw.title),
                url: getStr(raw.webpage_url),
                thumbnail: getStr(raw.thumbnail),
                
                platform: getPlatform(raw.extractor_key || raw.extractor),
                type: raw.is_live ? 'live' : 'video',
                language: raw.language || null,

                description: getStr(raw.description),
                tags: Array.isArray(raw.tags) ? raw.tags : [],
                categories: Array.isArray(raw.categories) ? raw.categories : [],
                
                metrics: {
                    views: getNum(raw.view_count),
                    likes: getNum(raw.like_count),
                    comments: getNum(raw.comment_count),
                    shares: getNum(raw.repost_count) 
                },
                
                audio: {
                    track: raw.track || raw.alt_title || null,
                    artist: raw.artist || raw.creator || raw.uploader || null,
                    is_trend: !!(raw.track || raw.artist)
                },

                creator: {
                    name: raw.uploader || raw.channel || null,
                    id: raw.uploader_id || raw.channel_id || null,
                    url: raw.uploader_url || raw.channel_url || null,
                    subscribers: getNum(raw.channel_follower_count)
                },

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
    console.log(`🔥 Yupias Resolver v11 (HYBRID) listo en ${PORT}`);
});
