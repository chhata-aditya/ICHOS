const https = require('https');

function cleanTitle(rawTitle = '') {
  return rawTitle
    .replace(/\s*[-–—]\s*Official.*$/i, '')
    .replace(/\s*\(Official.*?\)/gi, '')
    .replace(/\s*\[Official.*?\]/gi, '')
    .replace(/\s*\(Lyric.*?\)/gi, '')
    .replace(/\s*\[Lyric.*?\]/gi, '')
    .replace(/\s*\(Audio.*?\)/gi, '')
    .replace(/\s*\[Audio.*?\]/gi, '')
    .replace(/\s*\(Video.*?\)/gi, '')
    .replace(/\s*\[Video.*?\]/gi, '')
    .replace(/\s*\(Remastered.*?\)/gi, '')
    .replace(/\s*\[Remastered.*?\]/gi, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*ft\..*$/i, '')
    .replace(/\s*\(HD\)/gi, '')
    .replace(/\s*\[HD\]/gi, '')
    .replace(/\s*\(4K\)/gi, '')
    .replace(/\s*\[4K\]/gi, '')
    .trim();
}

function parseLrc(lrcText = '') {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed = [];

  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    const text = trimmed.replace(timeRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const totalSeconds = minutes * 60 + seconds;

      parsed.push({
        time: parseFloat(totalSeconds.toFixed(2)),
        text,
      });
    }
  }

  parsed.sort((a, b) => a.time - b.time);
  return parsed;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'ICHOS-Music-App/2.0' } }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve(parsed);
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

async function getLyrics(trackTitle = '', artistName = '', duration = 0) {
  const cleanedTitle = cleanTitle(trackTitle);
  const cleanedArtist = (artistName || '').replace(/Official.*$/i, '').trim();

  // Try exact lookup on LRCLIB
  try {
    const exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanedTitle)}&artist_name=${encodeURIComponent(cleanedArtist)}${duration > 0 ? `&duration=${Math.round(duration)}` : ''}`;
    const data = await fetchJson(exactUrl);

    if (data && (data.syncedLyrics || data.plainLyrics)) {
      const lines = parseLrc(data.syncedLyrics);
      return {
        track: data.trackName || cleanedTitle,
        artist: data.artistName || cleanedArtist,
        isSynced: lines.length > 0,
        lines: lines.length > 0 ? lines : (data.plainLyrics || '').split('\n').map((text) => ({ time: 0, text: text.trim() })).filter((l) => l.text),
        plainLyrics: data.plainLyrics || '',
        source: 'lrclib',
      };
    }
  } catch (err) {
    console.warn('LRCLIB exact lookup failed:', err.message);
  }

  // Try search query on LRCLIB
  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanedTitle} ${cleanedArtist}`)}`;
    const searchResults = await fetchJson(searchUrl);

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const best = searchResults.find((r) => r.syncedLyrics) || searchResults[0];
      if (best && (best.syncedLyrics || best.plainLyrics)) {
        const lines = parseLrc(best.syncedLyrics);
        return {
          track: best.trackName || cleanedTitle,
          artist: best.artistName || cleanedArtist,
          isSynced: lines.length > 0,
          lines: lines.length > 0 ? lines : (best.plainLyrics || '').split('\n').map((text) => ({ time: 0, text: text.trim() })).filter((l) => l.text),
          plainLyrics: best.plainLyrics || '',
          source: 'lrclib-search',
        };
      }
    }
  } catch (err) {
    console.warn('LRCLIB search lookup failed:', err.message);
  }

  // Fallback if no online lyrics found
  return {
    track: cleanedTitle,
    artist: cleanedArtist,
    isSynced: false,
    lines: [
      { time: 0, text: `♪ Listening to ${cleanedTitle} by ${cleanedArtist} ♪` },
      { time: 10, text: `[Instrumental & Spatial Audio Atmosphere]` },
      { time: 30, text: `Feel the rhythm and spatial resonance...` },
    ],
    plainLyrics: `♪ Listening to ${cleanedTitle} by ${cleanedArtist} ♪\n[Instrumental & Spatial Audio Atmosphere]`,
    source: 'fallback',
  };
}

module.exports = { getLyrics, cleanTitle, parseLrc };
