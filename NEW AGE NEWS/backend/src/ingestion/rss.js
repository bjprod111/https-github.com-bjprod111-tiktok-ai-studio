import Parser from 'rss-parser';
import { validateArticle } from './validate.js';

const parser = new Parser();

export async function fetchRssSource(source, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'user-agent': 'NEW-AGE-NEWS/0.1 (+local development)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    const fetchedAt = new Date().toISOString();

    const articles = [];
    for (const item of feed.items || []) {
      const article = {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        url: item.link,
        title: item.title?.trim() || '',
        description: item.contentSnippet || item.content || item.summary || '',
        author: item.creator || item.author || '',
        publishedAt: item.isoDate || item.pubDate || null,
        fetchedAt,
        imageUrl: item.enclosure?.url || item['media:content']?.url || null,
        language: source.language || null,
        country: source.country || null,
        category: source.category || null
      };

      const validation = validateArticle(article);
      if (validation.valid) articles.push(article);
    }

    return { articles, fetchedAt, error: null };
  } finally {
    clearTimeout(timeout);
  }
}
