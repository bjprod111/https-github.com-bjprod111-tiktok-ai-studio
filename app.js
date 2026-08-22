const state = {
  currentView: 'studio',
  history: ['studio'],
  apiKey: localStorage.getItem('PULSE_GEMINI_KEY') || '',
  projects: JSON.parse(localStorage.getItem('PULSE_PROJECTS') || '[]'),
  feed: JSON.parse(localStorage.getItem('PULSE_FEED') || '[]'),
  currentOutput: null
};

if (state.feed.length === 0) {
  state.feed = [
    {
      id: 'f1',
      topic: 'Minimalist Desk Setup 2026',
      author: '@tech_vibes',
      likes: 42,
      script: "[0-3s Hook]\nStop scrolling if your desk is messy.\n\n[3-15s Body]\nHere are 3 aesthetic gadgets that transformed my productivity space...",
      caption: "Desk upgrades you actually need ✨ #techdesk #minimalism #workspace"
    }
  ];
  localStorage.setItem('PULSE_FEED', JSON.stringify(state.feed));
}

const btnBack = document.getElementById('btnBack');
const btnHome = document.getElementById('btnHome');
const apiKeyStatusDot = document.getElementById('apiKeyStatusDot');
const keyWarningBanner = document.getElementById('keyWarningBanner');
const accountApiKeyInput = document.getElementById('accountApiKeyInput');
const btnSaveAccountKey = document.getElementById('btnSaveAccountKey');

const studioForm = document.getElementById('studioForm');
const generateBtn = document.getElementById('generateBtn');
const resultsContainer = document.getElementById('resultsContainer');
const scriptOutput = document.getElementById('scriptOutput');
const captionOutput = document.getElementById('captionOutput');
const btnSaveProject = document.getElementById('btnSaveProject');
const btnPostToFeed = document.getElementById('btnPostToFeed');

document.addEventListener('DOMContentLoaded', () => {
  updateApiKeyUI();
  renderProjects();
  renderCommunityFeed();

  btnBack.addEventListener('click', goBack);
  btnHome.addEventListener('click', () => navTo('studio', false));

  btnSaveAccountKey.addEventListener('click', () => {
    const val = accountApiKeyInput.value.trim();
    if (val) {
      state.apiKey = val;
      localStorage.setItem('PULSE_GEMINI_KEY', val);
      updateApiKeyUI();
      alert('Gemini API Key saved successfully!');
    }
  });

  studioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.apiKey) {
      alert('Please enter your Gemini API Key in Settings first.');
      navTo('account');
      return;
    }

    const topic = document.getElementById('topicInput').value;
    const audience = document.getElementById('audienceInput').value || 'General Audience';
    const tone = document.getElementById('toneSelect').value;

    generateBtn.disabled = true;
    generateBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Generating Content...</span>`;
    resultsContainer.classList.add('hidden');

    try {
      const data = await generateStudioResults(topic, audience, tone);
      state.currentOutput = { id: Date.now().toString(), topic, audience, tone, ...data };

      scriptOutput.textContent = data.script;
      captionOutput.textContent = `${data.caption}\n\n${data.hashtags.join(' ')}`;

      resultsContainer.classList.remove('hidden');
      resultsContainer.classList.add('flex');
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate Content Bundle</span>`;
    }
  });

  btnSaveProject.addEventListener('click', () => {
    if (!state.currentOutput) return;
    state.projects.unshift(state.currentOutput);
    localStorage.setItem('PULSE_PROJECTS', JSON.stringify(state.projects));
    renderProjects();
    alert('Saved to Projects!');
  });

  btnPostToFeed.addEventListener('click', () => {
    if (!state.currentOutput) return;
    const feedItem = {
      id: Date.now().toString(),
      topic: state.currentOutput.topic,
      author: '@you',
      likes: 1,
      script: state.currentOutput.script,
      caption: `${state.currentOutput.caption} ${state.currentOutput.hashtags.join(' ')}`
    };
    state.feed.unshift(feedItem);
    localStorage.setItem('PULSE_FEED', JSON.stringify(state.feed));
    renderCommunityFeed();
    alert('Published to Feed!');
    navTo('community');
  });
});

function navTo(viewName, addToHistory = true) {
  if (state.currentView === viewName) return;
  document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('nav-active'));
  const activeTab = document.getElementById(`tab-${viewName}`);
  if (activeTab) activeTab.classList.add('nav-active');

  if (addToHistory) state.history.push(viewName);
  state.currentView = viewName;

  if (state.history.length > 1) btnBack.classList.remove('hidden');
  else btnBack.classList.add('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (state.history.length > 1) {
    state.history.pop();
    navTo(state.history[state.history.length - 1], false);
  }
}

function updateApiKeyUI() {
  if (state.apiKey) {
    apiKeyStatusDot.classList.replace('bg-amber-500', 'bg-emerald-500');
    keyWarningBanner.classList.add('hidden');
    accountApiKeyInput.value = state.apiKey;
  } else {
    apiKeyStatusDot.classList.replace('bg-emerald-500', 'bg-amber-500');
    keyWarningBanner.classList.remove('hidden');
  }
}

async function generateStudioResults(topic, audience, tone) {
  // Candidate endpoints ordered by preference
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest'
  ];

  const prompt = `
You are an expert TikTok & Instagram Reels strategist.
Generate a content bundle for:
Topic: ${topic}
Audience: ${audience}
Tone: ${tone}

Return strict JSON ONLY matching this format (no markdown code blocks):
{
  "script": "[0-3s Hook]\\nVoiceover text...\\n\\n[3-15s Body]\\nVoiceover text...",
  "caption": "Catchy post caption...",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}
`;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const rawText = result.candidates[0].content.parts[0].text;
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (err) {
      console.warn(`Model ${model} failed, attempting next fallback...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All model endpoints failed.');
}

function renderProjects() {
  const container = document.getElementById('projectsList');
  document.getElementById('projectCount').textContent = `${state.projects.length} items`;

  if (state.projects.length === 0) {
    container.innerHTML = `<div class="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">No saved projects yet.</div>`;
    return;
  }

  container.innerHTML = state.projects.map((p, idx) => `
    <div class="glass-card rounded-2xl p-4 flex flex-col gap-2">
      <div class="flex justify-between items-start">
        <h4 class="font-bold text-xs text-indigo-300">${escapeHtml(p.topic)}</h4>
        <button onclick="deleteProject(${idx})" class="text-gray-500 hover:text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
      <p class="text-[11px] text-gray-400 line-clamp-2 bg-gray-900/60 p-2 rounded-lg font-mono">${escapeHtml(p.script)}</p>
    </div>
  `).join('');
}

function renderCommunityFeed() {
  const container = document.getElementById('communityFeedList');
  container.innerHTML = state.feed.map(item => `
    <div class="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <span class="text-xs font-semibold text-gray-300">${item.author}</span>
        <span class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">${item.topic}</span>
      </div>
      <p class="text-xs text-gray-300 font-mono bg-gray-900/60 p-2.5 rounded-xl border border-gray-800">${escapeHtml(item.script)}</p>
    </div>
  `).join('');
}

function deleteProject(index) {
  state.projects.splice(index, 1);
  localStorage.setItem('PULSE_PROJECTS', JSON.stringify(state.projects));
  renderProjects();
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
