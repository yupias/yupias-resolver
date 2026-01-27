const express = require('express');
const app = express();

const PORT = 3333;

// middleware básico
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.json({
    service: 'yupias-resolver',
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// resolver REAL
app.get('/resolve', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      error: 'missing_url',
      message: 'You must provide ?url='
    });
  }

  // detección simple de plataforma
  let platform = 'unknown';
  if (url.includes('tiktok.com')) platform = 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
  if (url.includes('instagram.com')) platform = 'instagram';

  return res.json({
    service: 'yupias-resolver',
    platform,
    original_url: url,
    message: 'Resolver OK – listo para extracción real',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yupias Resolver running on port ${PORT}`);
});



