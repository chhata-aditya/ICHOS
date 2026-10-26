/**
 * Context-Aware Music Track Ranking Service
 * Evaluates candidate YouTube search results against the Vibe Profile and user prompt.
 */

function cleanText(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function calculateTrackScore(track, vibe = {}, prompt = '') {
  const title = cleanText(track.title);
  const artist = cleanText(track.artist || track.channelTitle);
  const description = cleanText(track.description);
  const combined = `${title} ${artist} ${description}`;

  const promptWords = cleanText(prompt)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const keywords = (vibe.keywords || []).map(cleanText).filter(Boolean);
  const genres = (vibe.genres || []).map(cleanText).filter(Boolean);
  const mood = (vibe.mood || []).map(cleanText).filter(Boolean);

  let score = 50; // base score

  // 1. Prompt Word Relevance
  let promptMatches = 0;
  for (const word of promptWords) {
    if (title.includes(word)) promptMatches += 2;
    else if (combined.includes(word)) promptMatches += 1;
  }
  score += Math.min(25, promptMatches * 5);

  // 2. Keyword Match (30% weight)
  let keywordMatches = 0;
  for (const kw of keywords) {
    if (title.includes(kw)) keywordMatches += 3;
    else if (combined.includes(kw)) keywordMatches += 1.5;
  }
  score += Math.min(30, keywordMatches * 4);

  // 3. Genre & Mood Match (20% weight)
  let genreMatches = 0;
  for (const g of genres) {
    if (combined.includes(g)) genreMatches += 3;
  }
  for (const m of mood) {
    if (combined.includes(m)) genreMatches += 2;
  }
  score += Math.min(20, genreMatches * 3);

  // 4. Quality & Release Signals (20% boost)
  const rawTitle = (track.title || '').toLowerCase();
  const rawChannel = (track.channelTitle || '').toLowerCase();

  if (/official\s+(music\s+)?video|official\s+audio|lyric\s+video/.test(rawTitle)) {
    score += 15;
  }
  if (/topic|vevo|records|official/.test(rawChannel)) {
    score += 10;
  }

  // 5. Negative Penalties (-40% penalty)
  if (
    /10\s*hour|1\s*hour|extended\s*mix|tutorial|how\s*to|reaction|review|gameplay|podcast|parody|behind\s*the\s*scenes|karaoke|instrumental\s*only|guitar\s*lesson/.test(
      rawTitle
    )
  ) {
    score -= 40;
  }

  return score;
}

function rankTracks(candidates = [], vibe = {}, prompt = '') {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  // Deduplicate by videoId
  const seen = new Set();
  const uniqueCandidates = candidates.filter((item) => {
    if (!item.videoId || seen.has(item.videoId)) return false;
    seen.add(item.videoId);
    return true;
  });

  const scoredTracks = uniqueCandidates.map((track) => ({
    ...track,
    _score: calculateTrackScore(track, vibe, prompt),
  }));

  // Sort descending by score
  scoredTracks.sort((a, b) => b._score - a._score);

  // Return top 10 to 15 songs (clean metadata)
  const topTracks = scoredTracks.slice(0, 15).map(({ _score, ...track }) => track);

  return topTracks;
}

module.exports = { rankTracks, calculateTrackScore };
