const VIBE_PROFILE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mood',
    'energy',
    'danceability',
    'atmosphere',
    'genres',
    'tempo',
    'keywords',
    'targetQueries',
    'context',
  ],
  properties: {
    mood: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key emotional moods (e.g. nostalgic, confident, serene, euphoric)',
    },
    energy: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Energy intensity from 0.0 (calm/chill) to 1.0 (explosive/hype)',
    },
    danceability: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Rhythmic danceability from 0.0 to 1.0',
    },
    atmosphere: {
      type: 'array',
      items: { type: 'string' },
      description: 'Spatial and environmental characteristics (e.g. neon, rainy, cinematic, cyber)',
    },
    genres: {
      type: 'array',
      items: { type: 'string' },
      description: 'Musical genres (e.g. synthwave, hard rock, lo-fi, indie folk)',
    },
    tempo: {
      type: 'string',
      enum: ['slow', 'medium', 'fast'],
      description: 'Tempo speed classification',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: 'Aesthetic, instrumental, and stylistic keywords',
    },
    targetQueries: {
      type: 'array',
      items: { type: 'string' },
      description:
        '5-8 curated high-precision YouTube music search queries (including artist and track titles or subgenres) to find official audio on YouTube',
    },
    context: {
      type: 'string',
      description: 'A 1-sentence poetic summary explaining the musical intent of this curation',
    },
  },
};

module.exports = { VIBE_PROFILE_SCHEMA };
