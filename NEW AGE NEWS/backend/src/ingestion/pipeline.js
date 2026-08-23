import { db } from '../db.js';
import { fetchRssSource } from './rss.js';

export async function ingestSource(source) {
  const fetchedAt = new Date().toISOString();
  db.prepare('UPDATE sources SET last_fetched_at = ? WHERE id = ?').run(fetchedAt, source.id);

  try {
    const result = await fetchRssSource(source, Number(process.env.INGEST_TIMEOUT_MS || 10000));
    const insert = db.prepare(`
      INSERT OR IGNORE INTO articles
      (source_id, source_name, source_url, article_url, title, description, author,
       published_at, fetched_at, image_url, language, country, category)
      VALUES (@sourceId, @sourceName, @sourceUrl, @url, @title, @description, @author,
              @publishedAt, @fetchedAt, @imageUrl, @language, @country, @category)
    `);

    const transaction = db.transaction((articles) => {
      let inserted = 0;
      for (const article of articles) inserted += insert.run(article).changes;
      return inserted;
    });

    const inserted = transaction(result.articles);
    db.prepare('UPDATE sources SET last_success_at = ?, last_error = NULL WHERE id = ?')
      .run(result.fetchedAt, source.id);
    return { sourceId: source.id, fetched: result.articles.length, inserted };
  } catch (error) {
    db.prepare('UPDATE sources SET last_error = ? WHERE id = ?')
      .run(String(error.message || error), source.id);
    return { sourceId: source.id, fetched: 0, inserted: 0, error: String(error.message || error) };
  }
}

export async function ingestEnabledSources() {
  const sources = db.prepare('SELECT * FROM sources WHERE enabled = 1 ORDER BY id').all();
  const results = [];
  for (const source of sources) results.push(await ingestSource(source));
  return results;
}
