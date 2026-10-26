/** Local development track catalog */
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const mockTracks = [
  {
    id: 'last-kiss-of-nebulon',
    title: 'Last Kiss Of Nebulon',
    artist: 'Tory Lanez',
    album: 'Local',
    duration: '0:00',
    artwork: publicAsset('images/last-kiss-of-nebulon-cover.jpg'),
    audioUrl: publicAsset('audio/last-kiss-of-nebulon.mp3'),
  },

  {
    id: 'travis-scott-pbt',
    title: 'PBT',
    artist: 'Travis Scott',
    album: 'Local',
    duration: '0:00',
    artwork: publicAsset('images/last-kiss-of-nebulon-cover.jpg'),
    audioUrl: publicAsset('audio/Travis Scott - PBT (no Vybz Kartel version).mp3'),
  },

  {
    id: 'lana-first-light',
    title: 'First Light',
    artist: 'Lana Del Rey',
    album: 'Local',
    duration: '0:00',
    artwork: publicAsset('images/last-kiss-of-nebulon-cover.jpg'),
    audioUrl: publicAsset('audio/Lana Del Rey - First Light (Lyric Video) (1).mp3'),
  },
];

export const mockNowPlaying = mockTracks[0];
