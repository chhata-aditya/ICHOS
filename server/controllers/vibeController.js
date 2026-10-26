const { analyzeImage, analyzeText } = require('../services/vibeService');

async function textToVibe(req, res, next) {
  try {
    const prompt = req.body?.prompt?.trim();
    if (!prompt) return res.status(400).json({ error: 'A text prompt is required.' });
    if (prompt.length > 600) return res.status(400).json({ error: 'Keep the prompt under 600 characters.' });
    return res.json(await analyzeText(prompt));
  } catch (error) {
    return next(error);
  }
}

async function imageToVibe(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'An image file is required.' });
    return res.json(await analyzeImage(req.file));
  } catch (error) {
    return next(error);
  }
}

module.exports = { textToVibe, imageToVibe };
