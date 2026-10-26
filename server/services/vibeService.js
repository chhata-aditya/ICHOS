const OpenAI = require('openai');
const { VIBE_PROFILE_SCHEMA } = require('../config/vibeSchema');

const SYSTEM_INSTRUCTIONS = `You are ICHOS's AI Music Intent Engine. Your job is to deeply analyze the user's prompt (mood, story, character vibe, scene, or musical request) and generate a comprehensive Vibe Profile and high-precision YouTube Search Plan.

For every input:
1. Extract the emotional mood, energy level (0.0 - 1.0), rhythmic danceability (0.0 - 1.0), spatial atmosphere, and genre classification.
2. Formulate 5 to 8 hyper-targeted YouTube search queries in 'targetQueries' designed to retrieve the finest official music videos / official audio tracks on YouTube matching this exact vibe (combine iconic song titles, renowned artists, and subgenres with 'official audio' or 'official video').
3. Produce a concise, evocative context summary.
Always adhere strictly to the JSON schema.`;

function fallbackProfile(text = '', context = 'natural language prompt') {
  const input = text.toLowerCase().trim();

  // Pattern checks for archetypes & vibes
  const isBarbie = /barbie|pink|doll|dance the night|aqua|girly|glam|bubblegum/.test(input);
  const isIronMan = /iron man|tony stark|avengers|ac\/dc|heavy rock|metal|power armor|superhero|rock/.test(input);
  const isHarveySpecter = /harvey specter|suits|executive|luxury|gentleman|lawyer|smooth|confidence|night drive|blues/.test(input);
  const isBlindingLights = /blinding lights|the weeknd|synthwave|retrowave|80s|synthpop|neon|midnight drive|retro/.test(input);
  const isEmotionalRain = /rain|melanchol|sad|crying|lonely|emotional|acoustic|heartbreak|grief|peaceful/.test(input);
  const isWorkout = /workout|gym|hype|beast|pump|training|running|lift|high energy|edm|trap/.test(input);
  const isStudy = /study|focus|chill|coding|lo-fi|lofi|ambient|reading|calm|zen/.test(input);
  const isParty = /party|dance|club|festival|house|banger|disco/.test(input);

  if (isBarbie) {
    return {
      mood: ['playful', 'euphoric', 'glamorous', 'fun'],
      energy: 0.88,
      danceability: 0.95,
      atmosphere: ['pink', 'glitter', 'bubblegum', 'vibrant'],
      genres: ['dance pop', 'bubblegum pop', 'disco pop', 'europop'],
      tempo: 'fast',
      keywords: ['barbie girl', 'dance pop', 'pink aesthetic', 'glam disco', 'fun upbeat'],
      targetQueries: [
        'Aqua Barbie Girl official video',
        'Dua Lipa Dance The Night Barbie soundtrack',
        'Billie Eilish What Was I Made For Barbie',
        'Nicki Minaj Ice Spice Barbie World',
        'Ryan Gosling Im Just Ken official audio',
        'Charli XCX Speed Drive Barbie',
      ],
      context: text || 'Pink glam bubblegum pop & Barbie soundtrack anthems',
    };
  }

  if (isIronMan) {
    return {
      mood: ['confident', 'electrifying', 'unstoppable'],
      energy: 0.94,
      danceability: 0.65,
      atmosphere: ['high-tech', 'arena rock', 'cinematic'],
      genres: ['hard rock', 'heavy metal', 'alternative rock'],
      tempo: 'fast',
      keywords: ['ac/dc', 'guitar riffs', 'rock anthem', 'power energy', 'hard rock'],
      targetQueries: [
        'AC/DC Thunderstruck official audio',
        'AC/DC Back In Black official video',
        'AC/DC Shoot to Thrill Iron Man',
        'Black Sabbath Iron Man official audio',
        'Linkin Park Numb official music video',
        'Led Zeppelin Immigrant Song official audio',
      ],
      context: text || 'High-tech armor rock & legendary power riffs',
    };
  }

  if (isHarveySpecter) {
    return {
      mood: ['confident', 'sophisticated', 'unapologetic'],
      energy: 0.74,
      danceability: 0.60,
      atmosphere: ['luxury', 'executive', 'sleek', 'midnight'],
      genres: ['alternative', 'soul pop', 'indie rock', 'blues rock'],
      tempo: 'medium',
      keywords: ['soul rock', 'luxury blues', 'sophisticated pop', 'swagger', 'executive'],
      targetQueries: [
        'Ima Robot Greenback Boogie Suits theme',
        'The Black Keys Gold on the Ceiling',
        'Kaleo Way Down We Go official video',
        'Tory Lanez The Color Violet audio',
        'Arctic Monkeys Do I Wanna Know official video',
      ],
      context: text || 'Harvey Specter executive confidence & midnight blues',
    };
  }

  if (isBlindingLights) {
    return {
      mood: ['nostalgic', 'euphoric', 'dynamic'],
      energy: 0.85,
      danceability: 0.88,
      atmosphere: ['neon', '80s retro', 'midnight drive'],
      genres: ['synthwave', 'synthpop', '80s pop', 'dance pop'],
      tempo: 'fast',
      keywords: ['synthwave', 'synthpop', '80s retro', 'analog synths', 'night drive'],
      targetQueries: [
        'The Weeknd Blinding Lights official audio',
        'The Weeknd Save Your Tears official video',
        'The Weeknd In Your Eyes official video',
        'Kavinsky Nightcall Drive soundtrack',
        'M83 Midnight City official video',
        'Dua Lipa Physical official video',
      ],
      context: text || '80s Synthwave & Neon Midnight Pop',
    };
  }

  if (isEmotionalRain) {
    return {
      mood: ['melancholic', 'reflective', 'deep'],
      energy: 0.30,
      danceability: 0.25,
      atmosphere: ['rainy', 'intimate', 'cinematic'],
      genres: ['indie folk', 'ambient', 'sad indie', 'acoustic'],
      tempo: 'slow',
      keywords: ['emotional acoustic', 'rainy day indie', 'melancholic piano', 'sad ballad'],
      targetQueries: [
        'Adele Someone Like You official video',
        'Lana Del Rey Summertime Sadness official video',
        'Coldplay The Scientist official video',
        'Billie Eilish Lovely ft Khalid',
        'Lewis Capaldi Someone You Loved official video',
      ],
      context: text || 'Rainy day emotional reflection & acoustic melancholy',
    };
  }

  if (isWorkout) {
    return {
      mood: ['intense', 'hyped', 'unstoppable'],
      energy: 0.95,
      danceability: 0.80,
      atmosphere: ['aggressive', 'adrenaline', 'gym'],
      genres: ['trap', 'phonk', 'drum and bass', 'hip hop'],
      tempo: 'fast',
      keywords: ['gym phonk', 'trap beats', 'workout motivation', 'bass boost', 'hype music'],
      targetQueries: [
        'Eminem Till I Collapse official audio',
        'Kordhell Murder In My Mind phonk',
        'AC/DC Thunderstruck official audio',
        'Dua Lipa Physical official video',
        'Skrillex Bangarang official video',
      ],
      context: text || 'High intensity workout energy & adrenaline beats',
    };
  }

  if (isStudy) {
    return {
      mood: ['focused', 'serene', 'mindful'],
      energy: 0.35,
      danceability: 0.30,
      atmosphere: ['chill', 'cozy', 'minimal'],
      genres: ['lo-fi', 'ambient', 'chillhop', 'downtempo'],
      tempo: 'slow',
      keywords: ['lofi hip hop', 'chill study beats', 'ambient focus', 'coffee shop lofi'],
      targetQueries: [
        'Lofi Girl beats to relax study to',
        'Lofi Girl beats to sleep chill to',
        'ChilledCow lofi hip hop radio',
        'Ludovico Einaudi Nuvole Bianche',
        'C418 Sweden Minecraft soundtrack',
      ],
      context: text || 'Deep focus, coding flow & tranquil study beats',
    };
  }

  if (isParty) {
    return {
      mood: ['euphoric', 'vibrant', 'celebratory'],
      energy: 0.90,
      danceability: 0.92,
      atmosphere: ['club', 'festival', 'illuminated'],
      genres: ['edm', 'house', 'dance pop', 'future bass'],
      tempo: 'fast',
      keywords: ['club banger', 'festival edm', 'dance party', 'house music'],
      targetQueries: [
        'Calvin Harris Summer official video',
        'Dua Lipa Levitating official video',
        'Avicii Levels official video',
        'David Guetta Titanium ft Sia',
        'The Chainsmokers Closer official video',
      ],
      context: text || 'High energy dance party & festival EDM bangers',
    };
  }

  // Dynamic generic fallback
  const words = input.split(/\s+/).filter((w) => w.length > 2);
  const searchKeywords = words.length ? words : ['contemporary', 'indie', 'electronic'];

  return {
    mood: ['expressive', 'atmospheric'],
    energy: 0.65,
    danceability: 0.55,
    atmosphere: ['immersive', 'contemporary'],
    genres: ['alternative', 'indie', 'electronic', 'pop'],
    tempo: 'medium',
    keywords: searchKeywords,
    targetQueries: [
      `${input} official music video`.trim(),
      `${input} official audio`.trim(),
      `${searchKeywords.join(' ')} popular hits official audio`,
      `${searchKeywords[0] || 'indie'} top tracks official video`,
    ],
    context: text || 'Curated music vibe based on user intent',
  };
}

function hasAiConfiguration() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function analyzeWithAi(content) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    instructions: SYSTEM_INSTRUCTIONS,
    input: [{ role: 'user', content }],
    text: {
      format: {
        type: 'json_schema',
        name: 'vibe_profile',
        strict: true,
        schema: VIBE_PROFILE_SCHEMA,
      },
    },
  });

  return JSON.parse(response.output_text);
}

async function analyzeText(prompt) {
  if (!hasAiConfiguration()) {
    return {
      profile: fallbackProfile(prompt, prompt || 'natural language prompt (heuristic intent engine)'),
      source: 'intent_engine_heuristic',
    };
  }

  try {
    const profile = await analyzeWithAi([{ type: 'input_text', text: prompt }]);
    return { profile, source: 'openai_intent_engine' };
  } catch (error) {
    console.warn('OpenAI intent analysis failed, using heuristic intent engine:', error.message);
    return {
      profile: fallbackProfile(prompt, prompt || 'natural language prompt (intent fallback)'),
      source: 'intent_engine_fallback',
    };
  }
}

async function analyzeImage(file) {
  if (!hasAiConfiguration()) {
    return {
      profile: fallbackProfile('', 'image upload (heuristic intent engine)'),
      source: 'intent_engine_heuristic',
    };
  }

  try {
    const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const profile = await analyzeWithAi([
      { type: 'input_text', text: 'Analyze this image and identify its mood, setting, atmosphere, and optimal musical soundtrack.' },
      { type: 'input_image', image_url: imageUrl, detail: 'low' },
    ]);
    return { profile, source: 'openai_vision_intent' };
  } catch (error) {
    console.warn('OpenAI vision intent analysis failed, using fallback:', error.message);
    return {
      profile: fallbackProfile('', 'image upload (intent fallback)'),
      source: 'intent_engine_fallback',
    };
  }
}

module.exports = { analyzeText, analyzeImage, fallbackProfile, hasAiConfiguration };
