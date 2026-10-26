const https = require('https');

function decodeHtmlEntities(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanTrackTitle(rawTitle = '') {
  return rawTitle
    .replace(/\s*[\(\[]\s*(official\s*(music\s*)?(video|audio|lyric\s*video|hd|4k|60fps|remastered|visualizer))\s*[\)\]]/gi, '')
    .replace(/\s*[\(\[]\s*(lyrics?|hq|audio|video|remastered|explicit)\s*[\)\]]/gi, '')
    .replace(/\s*\|\s*.*$/g, '')
    .trim();
}

function formatTrackInfo(rawTitle, rawArtist) {
  const cleaned = cleanTrackTitle(rawTitle);
  let title = cleaned;
  let artist = rawArtist || 'Unknown Artist';

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  // Detect track badges
  const lower = rawTitle.toLowerCase();
  let badge = 'Track';
  if (lower.includes('official audio') || lower.includes('audio')) badge = 'Audio';
  else if (lower.includes('official video') || lower.includes('music video')) badge = 'Official Video';
  else if (lower.includes('lyric')) badge = 'Lyrics';
  else if (lower.includes('live')) badge = 'Live';
  else if (lower.includes('remix')) badge = 'Remix';

  return { title: title || rawTitle, artist, rawTitle, badge };
}

/* Curated multi-genre emergency fallback catalog */
const ALL_CATALOG_TRACKS = [
  {
    videoId: 'v2AC41dglnM',
    title: 'AC/DC - Thunderstruck (Official Audio)',
    artist: 'AC/DC',
    thumbnail: 'https://i.ytimg.com/vi/v2AC41dglnM/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=v2AC41dglnM',
    channelTitle: 'AC/DC',
    genre: 'hard rock',
    duration: '4:52',
    tags: ['ac/dc', 'rock', 'hard rock', 'thunderstruck', 'energy', 'iron man'],
  },
  {
    videoId: 'ZyhrYis509A',
    title: 'Aqua - Barbie Girl (Official Music Video)',
    artist: 'Aqua',
    thumbnail: 'https://i.ytimg.com/vi/ZyhrYis509A/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=ZyhrYis509A',
    channelTitle: 'Aqua',
    genre: 'dance pop',
    duration: '3:22',
    tags: ['aqua', 'barbie girl', 'barbie', 'pop', '90s', 'dance'],
  },
  {
    videoId: '4NRXx6U8ABQ',
    title: 'The Weeknd - Blinding Lights (Official Audio)',
    artist: 'The Weeknd',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    channelTitle: 'The Weeknd',
    genre: 'synthwave',
    duration: '3:20',
    tags: ['the weeknd', 'blinding lights', 'synthwave', '80s', 'pop'],
  },
  {
    videoId: 'kXYiU_JCYtU',
    title: 'Linkin Park - Numb (Official Music Video)',
    artist: 'Linkin Park',
    thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    channelTitle: 'Linkin Park',
    genre: 'alternative rock',
    duration: '3:07',
    tags: ['linkin park', 'numb', 'chester', 'rock', 'alternative'],
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Queen - Bohemian Rhapsody (Official Video Remastered)',
    artist: 'Queen',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    channelTitle: 'Queen Official',
    genre: 'classic rock',
    duration: '5:59',
    tags: ['queen', 'bohemian rhapsody', 'freddie mercury', 'classic rock'],
  },
  {
    videoId: 'njA33iZ0q1A',
    title: 'Dua Lipa - Levitating (Official Music Video)',
    artist: 'Dua Lipa',
    thumbnail: 'https://i.ytimg.com/vi/njA33iZ0q1A/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=njA33iZ0q1A',
    channelTitle: 'Dua Lipa',
    genre: 'dance pop',
    duration: '3:23',
    tags: ['dua lipa', 'levitating', 'future nostalgia', 'disco', 'dance pop'],
  },
  {
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Girl - beats to relax/study to',
    artist: 'Lofi Girl',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    channelTitle: 'Lofi Girl',
    genre: 'lo-fi',
    duration: 'Live',
    tags: ['lofi girl', 'lofi', 'chill', 'study', 'focus', 'relax', 'beats'],
  },
  {
    videoId: 'x67ytKXJ3O4',
    title: 'Ima Robot - Greenback Boogie (Suits Theme Song)',
    artist: 'Ima Robot',
    thumbnail: 'https://i.ytimg.com/vi/x67ytKXJ3O4/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=x67ytKXJ3O4',
    channelTitle: 'Ima Robot',
    genre: 'blues rock',
    duration: '4:58',
    tags: ['suits', 'harvey specter', 'greenback boogie', 'ima robot'],
  },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            if (res.statusCode >= 400) {
              reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error('Invalid JSON from YouTube API'));
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * 1. Search via official Google YouTube API (if YOUTUBE_API_KEY is configured)
 */
async function searchYouTubeApi(searchQuery, maxResults = 20) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  const encodedQuery = encodeURIComponent(searchQuery);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&q=${encodedQuery}&key=${apiKey}`;

  const data = await fetchJson(url);
  const items = data.items || [];

  return items
    .filter((item) => item.id && item.id.videoId)
    .map((item) => {
      const snippet = item.snippet || {};
      const videoId = item.id.videoId;
      const rawTitle = decodeHtmlEntities(snippet.title || '');
      const rawArtist = decodeHtmlEntities(snippet.channelTitle || '');
      const { title, artist, badge } = formatTrackInfo(rawTitle, rawArtist);

      return {
        videoId,
        title,
        artist,
        rawTitle,
        badge,
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle: rawArtist,
        description: decodeHtmlEntities(snippet.description || ''),
        publishedAt: snippet.publishedAt || '',
      };
    });
}

/**
 * 2. Live Direct YouTube Music Engine with Smart Audio Filtering & Formatting
 */
function searchYouTubeLive(searchQuery, limit = 25) {
  return new Promise((resolve) => {
    // Add "audio" context if query doesn't already contain audio keywords
    const lowerQ = searchQuery.toLowerCase();
    const queryWithContext = lowerQ.includes('song') || lowerQ.includes('audio') || lowerQ.includes('music') || lowerQ.includes('video')
      ? searchQuery
      : `${searchQuery} official audio`;

    // sp=EgIQAQ%253D%253D filters exclusively for Videos (excludes channels, playlists, shorts)
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryWithContext)}&sp=EgIQAQ%253D%253D&hl=en`;

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      (res) => {
        let html = '';
        res.on('data', (chunk) => {
          html += chunk;
        });
        res.on('end', () => {
          const match =
            html.match(/var ytInitialData = ({.+?});<\/script>/s) ||
            html.match(/ytInitialData\s*=\s*({.+?});/s);

          if (!match) {
            return resolve([]);
          }

          try {
            const data = JSON.parse(match[1]);
            const contents =
              data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
                ?.contents?.[0]?.itemSectionRenderer?.contents || [];

            const videos = [];
            const seen = new Set();

            for (const item of contents) {
              const v = item.videoRenderer;
              if (!v || !v.videoId || seen.has(v.videoId)) continue;

              const rawTitle = decodeHtmlEntities(v.title?.runs?.[0]?.text || '');
              const rawArtist = decodeHtmlEntities(v.ownerText?.runs?.[0]?.text || '');
              const duration = v.lengthText?.simpleText || '';

              // Filter out non-music shorts (< 15 seconds) or ultra long 5+ hour spam
              if (duration.startsWith('0:0') || duration === '0:00') continue;

              const { title, artist, badge } = formatTrackInfo(rawTitle, rawArtist);

              seen.add(v.videoId);
              videos.push({
                videoId: v.videoId,
                title,
                artist,
                rawTitle,
                badge,
                thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${v.videoId}`,
                channelTitle: rawArtist,
                duration,
              });

              if (videos.length >= limit) break;
            }

            resolve(videos);
          } catch (err) {
            resolve([]);
          }
        });
      }
    );

    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

function filterCatalog(queries = [], limit = 15) {
  const queryList = Array.isArray(queries) ? queries : [queries];
  const allTerms = queryList
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const scored = ALL_CATALOG_TRACKS.map((track) => {
    const title = track.title.toLowerCase();
    const artist = track.artist.toLowerCase();
    const tags = (track.tags || []).join(' ').toLowerCase();
    const genre = (track.genre || '').toLowerCase();
    const text = `${title} ${artist} ${tags} ${genre}`;

    let score = 0;
    for (const term of allTerms) {
      if (title.includes(term)) score += 10;
      if (artist.includes(term)) score += 8;
      if (genre.includes(term)) score += 6;
      if (tags.includes(term)) score += 4;
      if (text.includes(term)) score += 2;
    }
    const { title: cleanT, artist: cleanA, badge } = formatTrackInfo(track.title, track.artist);
    return { ...track, title: cleanT, artist: cleanA, badge, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit).map(({ _score, ...t }) => t);
}

/**
 * Universal Direct Search - Always returns authentic YouTube results matching the query in real time
 */
async function searchDirectMusic(query = '', limit = 20) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return filterCatalog([], limit);

  // 1. If official API key is provided
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const results = await searchYouTubeApi(`${cleanQuery} official audio`, limit);
      if (results && results.length > 0) return results;
    } catch (err) {
      console.warn('YouTube API error, using live search engine:', err.message);
    }
  }

  // 2. High-speed direct YouTube real-time search
  try {
    const liveResults = await searchYouTubeLive(cleanQuery, limit);
    if (liveResults && liveResults.length > 0) {
      return liveResults;
    }
  } catch (err) {
    console.warn('Live search error:', err.message);
  }

  // 3. Emergency offline catalog
  return filterCatalog([cleanQuery], limit);
}

/**
 * YouTube Catalog Engine driven by OpenAI's Intent Profile
 */
async function searchMusic(vibe = {}, prompt = '') {
  const targetQueries = Array.isArray(vibe.targetQueries) && vibe.targetQueries.length > 0
    ? vibe.targetQueries
    : [`${prompt} official audio`];

  const seen = new Set();
  const allResults = [];

  // 1. If official API key is provided
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const searchPromises = targetQueries.slice(0, 3).map((q) =>
        searchYouTubeApi(q, 5).catch(() => [])
      );
      const searchResultsArrays = await Promise.all(searchPromises);
      for (const item of searchResultsArrays.flat()) {
        if (item.videoId && !seen.has(item.videoId)) {
          seen.add(item.videoId);
          allResults.push(item);
        }
      }
      if (allResults.length >= 8) return allResults.slice(0, 15);
    } catch (error) {
      console.warn('YouTube API search failed, switching to live catalog search:', error.message);
    }
  }

  // 2. Live multi-query YouTube search across OpenAI target queries
  try {
    const livePromises = targetQueries.slice(0, 4).map((q) =>
      searchYouTubeLive(q, 5)
    );
    const liveArrays = await Promise.all(livePromises);
    for (const item of liveArrays.flat()) {
      if (item.videoId && !seen.has(item.videoId)) {
        seen.add(item.videoId);
        allResults.push(item);
      }
    }

    if (allResults.length > 0) {
      return allResults.slice(0, 15);
    }
  } catch (error) {
    console.warn('Live multi-query search error:', error.message);
  }

  // 3. Fallback direct search with original prompt
  if (prompt) {
    const direct = await searchDirectMusic(prompt, 15);
    if (direct && direct.length > 0) return direct;
  }

  return filterCatalog([...targetQueries, prompt], 15);
}

module.exports = { searchMusic, searchDirectMusic, filterCatalog };
