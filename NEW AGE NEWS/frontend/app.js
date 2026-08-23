const API = 'http://localhost:4310/api';
const feed = document.querySelector('#feed');
const statusText = document.querySelector('#statusText');
const count = document.querySelector('#count');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
}

function render(articles) {
  count.textContent = `${articles.length} stories`;
  if (!articles.length) {
    feed.innerHTML = document.querySelector('#emptyTemplate').innerHTML;
    return;
  }
  feed.innerHTML = articles.map((article) => `
    <article class="story">
      <div>
        <div class="meta"><span class="source">${escapeHtml(article.sourceName)}</span> · ${escapeHtml(article.publishedAt || article.fetchedAt || '')}</div>
        <h2><a href="${escapeHtml(article.articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a></h2>
        <p>${escapeHtml(article.description || 'No description available.')}</p>
      </div>
      <a class="story-link" href="${escapeHtml(article.articleUrl)}" target="_blank" rel="noopener noreferrer">Original →</a>
    </article>`).join('');
}

async function checkHealth() {
  try {
    const response = await fetch(`${API}/health`);
    if (!response.ok) throw new Error('backend unavailable');
    const health = await response.json();
    statusText.textContent = `Pipeline online · ${health.sources} sources · ${health.articles} articles`;
  } catch {
    statusText.textContent = 'Backend offline · start the local server';
  }
}

async function loadFeed() {
  try {
    const response = await fetch(`${API}/feed`);
    if (!response.ok) throw new Error('feed unavailable');
    const data = await response.json();
    render(data.articles || []);
  } catch {
    feed.innerHTML = '<div class="empty"><h2>Local pipeline unavailable</h2><p>Start the NEW AGE NEWS backend on port 4310, then refresh this page.</p></div>';
  }
}

async function ingest() {
  statusText.textContent = 'Fetching and validating sources…';
  try {
    const response = await fetch(`${API}/ingest`, { method: 'POST' });
    if (!response.ok) throw new Error('ingestion failed');
    await loadFeed();
    await checkHealth();
  } catch {
    statusText.textContent = 'Ingestion failed · inspect backend logs';
  }
}

document.querySelector('#refreshBtn').addEventListener('click', loadFeed);
document.querySelector('#ingestBtn').addEventListener('click', ingest);

checkHealth();
loadFeed();
