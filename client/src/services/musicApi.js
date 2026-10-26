const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options) {
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'The music generation service is unavailable.');
  }
  return body;
}

export function generateMusicQueue(prompt) {
  return request('/music/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
}

export function searchMusicTracks(query = '') {
  const encoded = encodeURIComponent(query);
  return request(`/music/search?q=${encoded}`, {
    method: 'GET',
  });
}

export function fetchTrackLyrics(trackTitle = '', artistName = '', duration = 0) {
  const t = encodeURIComponent(trackTitle);
  const a = encodeURIComponent(artistName);
  const d = encodeURIComponent(duration || 0);
  return request(`/music/lyrics?track=${t}&artist=${a}&duration=${d}`, {
    method: 'GET',
  });
}
