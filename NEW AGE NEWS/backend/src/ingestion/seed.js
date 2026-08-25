import { db } from '../db.js';

const sources = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World', language: 'en', country: 'GB' },
  { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology', language: 'en', country: 'GB' },
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'World', language: 'en', country: 'US' }
];

const insert = db.prepare(`INSERT OR IGNORE INTO sources (name, url, type, category, language, country) VALUES (?, ?, 'rss', ?, ?, ?)`);
for (const source of sources) insert.run(source.name, source.url, source.category, source.language, source.country);
console.log(`Seeded ${sources.length} starter RSS sources.`);
