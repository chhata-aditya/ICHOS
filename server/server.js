require('dotenv').config();

const cors = require('cors');
const express = require('express');
const vibeRoutes = require('./routes/vibeRoutes');
const musicRoutes = require('./routes/musicRoutes');

const app = express();
const port = Number(process.env.PORT || 5000);

const allowedClientOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedClientOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
  });
});
app.use('/api/vibe', vibeRoutes);
app.use('/api/music', musicRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON body.' });
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return res.status(status).json({ error: error.message || 'Unable to analyze this input.' });
});

app.listen(port, () => {
  console.log(`ICHOS API listening at http://localhost:${port}`);
});
