const { analyzeText } = require('../services/vibeService');
const { searchMusic, searchDirectMusic } = require('../services/youtubeService');
const { rankTracks } = require('../services/rankingService');
const { getLyrics } = require('../services/lyricsService');

async function generateMusicQueue(req, res, next) {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

    if (!prompt) {
      return res.status(400).json({ error: 'A prompt describing your mood or musical vibe is required.' });
    }

    // 1. Analyze prompt -> Vibe Profile
    const { profile: vibeProfile, source } = await analyzeText(prompt);

    // 2. Search Music Candidates via YouTube
    const candidates = await searchMusic(vibeProfile, prompt);

    // 3. Rank Candidates -> Ordered 10-15 Song Queue
    const queue = rankTracks(candidates, vibeProfile, prompt);

    return res.json({
      prompt,
      vibe: vibeProfile,
      source,
      queue,
    });
  } catch (error) {
    console.error('Error generating music queue:', error);
    return next(error);
  }
}

async function searchTracks(req, res, next) {
  try {
    const query = typeof (req.query?.q || req.body?.query) === 'string' ? (req.query?.q || req.body?.query).trim() : '';

    const results = await searchDirectMusic(query, 20);

    return res.json({
      query,
      results,
    });
  } catch (error) {
    console.error('Error searching music tracks:', error);
    return next(error);
  }
}

async function fetchLyrics(req, res, next) {
  try {
    const track = typeof (req.query?.track || req.body?.track) === 'string' ? (req.query?.track || req.body?.track).trim() : '';
    const artist = typeof (req.query?.artist || req.body?.artist) === 'string' ? (req.query?.artist || req.body?.artist).trim() : '';
    const duration = parseFloat(req.query?.duration || req.body?.duration) || 0;

    if (!track) {
      return res.status(400).json({ error: 'Track title is required to fetch lyrics.' });
    }

    const lyricsData = await getLyrics(track, artist, duration);
    return res.json(lyricsData);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return next(error);
  }
}

module.exports = { generateMusicQueue, searchTracks, fetchLyrics };
