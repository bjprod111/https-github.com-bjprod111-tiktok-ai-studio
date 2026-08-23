import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { ingestEnabledSources, ingestSource } from './ingestion/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '../../frontend');
const app = express();
const port = Number(process.env.PORT || 4310);

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(express.static(frontendDir));

app.get('/api/health', (_req, res) => {
  const sources = db.prepare('SELECT COUNT(*) AS count FROM sources').get();
  const articles = db.prepare('SELECT COUNT(*) AS count FROM articles').get();
  res.json({ ok: true, service: 'new-age-news-backend', sources: sources.count, articles: articles.count });
});

app.get('/api/sources', (_req, res) => res.json(db.prepare('SELECT * FROM sources ORDER BY name').all()));

app.post('/api/sources', (req, res) => {
  const { name, url, type = 'rss', category = null, language = null, country = null } = req.body || {};
  if (!name || !url) return res.status(400).json({ error: 'name and url are required' });
  try {
    const result = db.prepare(`INSERT INTO sources (name, url, type, category, language, country) VALUES (?, ?, ?, ?, ?, ?)`).run(name, url, type, category, language, country);
    res.status(201).json(db.prepare('SELECT * FROM sources WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    res.status(409).json({ error: String(error.message || error) });
  }
});

app.post('/api/sources/:id/test', async (req, res) => {
  const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
  if (!source) return res.status(404).json({ error: 'source not found' });
  res.json(await ingestSource(source));
});

app.post('/api/ingest', async (_req, res) => res.json({ results: await ingestEnabledSources() }));

app.get('/api/feed', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const articles = db.prepare(`SELECT id, source_id AS sourceId, source_name AS sourceName, source_url AS sourceUrl, article_url AS articleUrl, title, description, author, published_at AS publishedAt, fetched_at AS fetchedAt, image_url AS imageUrl, language, country, category, summary, relevance_score AS relevanceScore, freshness_score AS freshnessScore, importance_score AS importanceScore, story_cluster_id AS storyClusterId FROM articles ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT ?`).all(limit);
  res.json({ articles });
});

app.get(/.*/, (_req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

app.listen(port, () => console.log(`NEW AGE NEWS running at http://localhost:${port}`));
