const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options) {
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The vibe service is unavailable.');
  return body;
}

export function analyzeTextVibe(prompt) {
  return request('/vibe/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
}

export function analyzeImageVibe(image) {
  const formData = new FormData();
  formData.append('image', image);
  return request('/vibe/image', { method: 'POST', body: formData });
}
