const express = require('express');
const { generateMusicQueue, searchTracks, fetchLyrics } = require('../controllers/musicController');

const router = express.Router();

router.post('/generate', generateMusicQueue);
router.get('/search', searchTracks);
router.post('/search', searchTracks);
router.get('/lyrics', fetchLyrics);

module.exports = router;
