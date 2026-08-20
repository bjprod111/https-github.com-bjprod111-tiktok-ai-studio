const state = { mode: 'ideas' };
let lastResults = [];
const modes = {
  ideas: { title: 'Viral idea generator', label: 'What are you exploring?', placeholder: 'e.g. morning routine, AI tools...', button: 'Generate', helper: 'Runs locally with sample intelligence. No API key or payment required.' },
  script: { title: 'Full script writer', label: 'What is your video about?', placeholder: 'e.g. 5 habits that changed my life...', button: 'Write script', helper: 'Build a punchy script with hook, body, visual cues and CTA.' },
  captions: { title: 'Captions & hooks', label: 'What is the video topic?', placeholder: 'e.g. beginner morning workout...', button: 'Create captions', helper: 'Get ready-to-post hooks, captions and calls to action.' },
  hashtags: { title: 'Hashtag direction', label: 'Describe the video', placeholder: 'e.g. budget meals for students...', button: 'Find tags', helper: 'A balanced mix of broad, medium and niche discovery tags.' }
};
const $ = (id) => document.getElementById(id);

function brief() { return { topic: $('topicInput').value.trim() || $('nicheSelect').value, niche: $('nicheSelect').value, tone: $('toneSelect').value, duration: $('durationSelect').value }; }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function card(title, body, tag = '') { return `<article class="result-card"><h3>${title}</h3>${body}${tag ? `<span class="card-tag">${tag}</span>` : ''}</article>`; }
function render(mode) { const config = modes[mode]; $('modeTitle').textContent = config.title; $('topicLabel').textContent = config.label; $('topicInput').placeholder = config.placeholder; $('generateButton').innerHTML = `${config.button} <span>↗</span>`; $('helperText').textContent = config.helper; $('results').innerHTML = ''; }
function generate() {
  const data = brief(); const topic = escapeHtml(data.topic); const niche = escapeHtml(data.niche); const tone = escapeHtml(data.tone); const duration = escapeHtml(data.duration);
  const results = {
    ideas: [
      card('The unexpected 10-second rule', `<p><strong>Hook:</strong> “You are wasting your first 10 seconds.”</p><p><strong>Concept:</strong> Show one fast transformation for ${topic}, then reveal the tiny rule behind it.</p><p><strong>Format:</strong> Face-to-camera + jump cuts</p>`, 'HIGH RETENTION'),
      card('Do this before you scroll', `<p><strong>Hook:</strong> “Before your next scroll, try this.”</p><p><strong>Why it works:</strong> A direct challenge with an immediate payoff feels personal and native to TikTok.</p><p><strong>Voice:</strong> ${tone} · ${duration}</p>`, 'COMMENT BAIT'),
      card('A beginner’s honest reset', `<p><strong>Hook:</strong> “I wish someone told me this on day one.”</p><p><strong>Concept:</strong> Three mistakes, one simple fix, and a closing question for the community.</p><p><strong>Lane:</strong> ${niche}</p>`, 'SAVE-WORTHY')
    ],
    script: [card('Hook · 0:00–0:03', `<p>“If you are trying to improve ${topic}, stop doing it the complicated way.”</p><p class="helper-text">[VISUAL: Start close to camera, text lands on the first beat]</p>`), card('Main beat · 0:03–0:24', `<p>“Here is the simple version. First, name the one result you want. Then remove the step that only makes you feel busy. Finally, repeat the useful part until it feels boring.”</p><p class="helper-text">[VISUAL: Three quick numbered cuts with large on-screen words]</p>`), card('CTA · final 3 seconds', `<p>“Send this to someone who needs a simpler plan, and follow for more ${niche} ideas.”</p>`, `${duration} SCRIPT`)],
    captions: [card('Hook 01', `<p><strong>“The part nobody tells you about ${topic}.”</strong></p><p>Small shift, big difference. Save this for your next reset.</p><p class="helper-text">CTA: “Which step are you trying first?”</p>`), card('Hook 02', `<p><strong>“I tested the popular advice so you do not have to.”</strong></p><p>Here is what actually worked, without the extra noise.</p><p class="helper-text">CTA: “Send this to your accountability friend.”</p>`), card('Hook 03', `<p><strong>“A realistic ${tone.toLowerCase()} take on ${topic}.”</strong></p><p>No perfect setup. Just a better next move.</p><p class="helper-text">CTA: “Follow for the next part.”</p>`, 'UNDER 150 CHARACTERS')],
    hashtags: [card('Broad reach', `<div class="tag-cloud"><span>#fyp</span><span>#tiktoktips</span><span>#viralvideo</span><span>#creator</span><span>#content</span></div>`), card('Medium competition', `<div class="tag-cloud"><span>#${slug(niche)}</span><span>#${slug(tone)}</span><span>#creatorideas</span><span>#postingtips</span><span>#growwithme</span></div>`), card('Niche signal', `<div class="tag-cloud"><span>#${slug(topic)}</span><span>#beginnercreator</span><span>#dailyprogress</span><span>#smartcontent</span></div><p class="helper-text">Mix 2 broad, 3 medium and 3 niche tags. Keep the caption natural.</p>`, 'DISCOVERY MIX')]
  };
  lastResults = results[state.mode];
  $('results').innerHTML = lastResults.join('');
  $('results').querySelectorAll('.result-card').forEach((result, index) => {
    result.insertAdjacentHTML('beforeend', `<button class="save-card" data-index="${index}">Save idea</button>`);
  });
  $('results').querySelectorAll('.save-card').forEach((button) => button.addEventListener('click', () => saveResult(Number(button.dataset.index))));
}
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'creator'; }
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 2400); }
function savedItems() { return JSON.parse(localStorage.getItem('pulse-saved') || '[]'); }
function saveResult(index) { const saved = savedItems(); saved.push({ mode: state.mode, html: lastResults[index], savedAt: new Date().toISOString() }); localStorage.setItem('pulse-saved', JSON.stringify(saved)); toast('Saved on this device.'); }
function showSaved() { const saved = savedItems(); $('modeTitle').textContent = 'Saved on this device'; $('topicLabel').textContent = 'Your private idea shelf'; $('topicInput').value = ''; $('helperText').textContent = 'Stored locally in this browser. Nothing is uploaded.'; $('results').innerHTML = saved.length ? saved.map((item) => item.html).join('') : card('Nothing saved yet', '<p>Generate an idea, script, caption or hashtag set, then tap Save idea.</p>'); }

document.querySelectorAll('.mode-tab').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.mode-tab').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.mode = button.dataset.mode; render(state.mode); }));
$('generateButton').addEventListener('click', generate);
$('topicInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') generate(); });
$('settingsButton').addEventListener('click', () => toast('Demo mode is ready. No API key needed.'));
$('studioButton').addEventListener('click', () => render(state.mode));
$('savedButton').addEventListener('click', showSaved);
$('infoButton').addEventListener('click', () => toast('Pulse Studio runs locally and costs nothing.'));
render('ideas');
