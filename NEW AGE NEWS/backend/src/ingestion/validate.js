const ARTICLE_URL = /^https?:\/\//i;

export function validateArticle(article) {
  const errors = [];
  if (!article?.title || article.title.trim().length < 3) errors.push('missing_or_invalid_title');
  if (!article?.url || !ARTICLE_URL.test(article.url)) errors.push('missing_or_invalid_url');
  if (!article?.sourceName) errors.push('missing_source');

  return {
    valid: errors.length === 0,
    errors,
    article
  };
}
