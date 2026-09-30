// Portfolio content. Edit here; the room reads everything from this file.
// MEDIA_BASE: '' serves media from this site; set to 'https://cady-codes.github.io/'
// to stream the videos already published on the main portfolio.
export const MEDIA_BASE = 'https://cady-codes.github.io/';

export const PROFILE = {
  name: 'Caden Padua',
  role: 'Video Editor',
  tagline: 'Let’s make videos together.',
  email: 'ugc.cadenpadua@gmail.com',
  instagram: 'https://www.instagram.com/caden_mp4/',
  instagramHandle: '@caden_mp4',
  photo: 'img/me.jpg',
  classicSite: 'https://cady-codes.github.io/',
};

export const SECTIONS = [
  {
    id: 'ugc',
    title: 'UGC Ads',
    blurb: 'High-performing ads I edited for my friend Darian Thao.',
    kind: 'vertical',
    items: [
      { title: 'Morning Routine', meta: 'Brick · 0:44', file: 'brick-morning-routine' },
      { title: 'Editing While Making Coffee', meta: 'Captions · 125,111 views · 0:38', file: 'captions-1' },
      { title: 'The Office Parody', meta: 'Brick · 1:09', file: 'brick-office-parody' },
      { title: 'A Day Without Social Media', meta: 'Brick · 0:58', file: 'brick-no-social-media' },
      { title: 'Raw Clip vs. AI Edit', meta: 'Captions · 98,653 views · 0:36', file: 'captions-2' },
      { title: 'The System That Actually Works', meta: 'Brick · 0:56', file: 'brick-system-that-works' },
    ],
  },
  {
    id: 'short',
    title: 'Short Form',
    blurb: 'Instagram reels I edited for Rembert Montald, and from Kristian Nee’s interviews with concept artist Greg Broadmore.',
    kind: 'vertical',
    items: [
      { title: 'Avoiding Burnout as an Artist', meta: 'Rembert Montald · 93,554 views', file: 'sf-rembert-1' },
      { title: 'Slow Down to Draw Better', meta: 'Rembert Montald · 90,215 views', file: 'sf-rembert-2' },
      { title: 'Make Mistakes Like Kim Jung Gi', meta: 'Rembert Montald · 61,693 views', file: 'sf-rembert-3' },
      { title: 'Treat Drawing Like a Video Game', meta: 'Greg Broadmore · 61,437 views', file: 'sf-greg-1' },
      { title: 'Painting With Only the Line Tool', meta: 'Greg Broadmore · 50,476 views', file: 'sf-greg-2' },
      { title: 'Imposter Syndrome as an Artist', meta: 'Rembert Montald · 45,391 views', file: 'sf-rembert-4' },
      { title: 'Drawing Bigger Than Life', meta: 'Greg Broadmore · 19,055 views', file: 'sf-greg-3' },
      { title: 'When a Drawing Is Finished', meta: 'Rembert Montald · 16,774 views', file: 'sf-rembert-5' },
      { title: 'Drawing From Memory', meta: 'Greg Broadmore · 14,850 views', file: 'sf-greg-4' },
      { title: 'When to Drop an Idea', meta: 'Greg Broadmore · 10,469 views', file: 'sf-greg-5' },
    ],
  },
  {
    id: 'long',
    title: 'Long Form',
    blurb: 'YouTube videos I edited for Rembert Montald and Kristian Nee.',
    kind: 'youtube',
    items: [
      { title: 'Why Great Artists Never Fear Mistakes (Peter Han)', meta: 'Rembert Montald · 108,470 views', yt: '_ub4gwlFtSA' },
      { title: '20 Years of Art Advice in 20 Minutes, with Greg Broadmore', meta: 'Kristian Nee · 62,981 views', yt: 'uhJoWH1vd9Q' },
      { title: 'How to Actually Get Better at Drawing in 2026', meta: 'Kristian Nee · 18,344 views', yt: 'Wz5XaEpJrzs' },
      { title: 'How a God of War Artist Designs Monsters', meta: 'Rembert Montald · 15,810 views', yt: 'spaW3QR8V-c' },
      { title: 'How to Draw the Chest with Simple Shapes', meta: 'Rembert Montald · 13,134 views', yt: 'J7DVZ_797_Y' },
      { title: 'You Never Really “Make It” as an Artist (Flint Dille)', meta: 'Kristian Nee', yt: 'BecYonShBuA' },
    ],
  },
];

// Sum of the public view counts listed above (Brick ads have no public count).
export const TOTAL_VIEWS = '900K+';

// Background music (top-left player). Loops; never autoplays, only starts when the visitor presses play.
export const MUSIC = {
  src: 'audio/le-festin.mp3',
  url: 'https://open.spotify.com/track/2yIDWbt3DB2BWtUsIsnwA4',
  title: 'Le Festin',
  artist: 'Pianaura · Piano Version',
  cover: 'img/cover-le-festin.jpg',
  volume: 0.25, // starts quiet; the site always opens paused
};
