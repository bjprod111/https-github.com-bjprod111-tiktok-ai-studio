import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/new-age-news.db';
const resolved = path.resolve(dbPath);
fs.mkdirSync(path.dirname(resolved), { recursive: true });

export const db = new Database(resolved);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'rss',
  category TEXT,
  language TEXT,
  country TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_fetched_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  article_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  image_url TEXT,
  language TEXT,
  country TEXT,
  category TEXT,
  summary TEXT,
  relevance_score REAL DEFAULT 0,
  freshness_score REAL DEFAULT 0,
  importance_score REAL DEFAULT 0,
  story_cluster_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(story_cluster_id);
`);
