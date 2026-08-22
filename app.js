// Pulse Studio — App Engine & State
const state = {
  currentView: 'studio',
  history: ['studio'],
  apiKey: localStorage.getItem('PULSE_GEMINI_KEY') || '',
  projects: JSON.parse(localStorage.getItem('PULSE_PROJECTS') || '[]'),
  feed: JSON.parse(localStorage.getItem('PULSE_FEED') || '[]'),
  currentOutput: null
};

// Default seed feed items if empty
if (state.feed.length === 0) {
  state.feed = [
    {
      id: 'f1',
      topic: 'Minimalist Desk Setup 2026',
      author: '@tech_vibes',
      likes: 42,
      script: "[0-3s Hook]\nStop scrolling if your desk is messy.\n\n[3-15s Body]\nHere are 3 aesthetic gadgets that transformed my productivity space...\n\n[Call to Action]\nSave this video for setup inspo!",
      caption: "Desk upgrades you actually need ✨ #techdesk #minimalism #workspace"
    },
    {
      id: 'f2',
      topic: 'Moroccan Mint Tea Story',
      author: '@atlas_explores',
      likes: 89,
      script: "[0-3s Hook]\nWhy do Moroccans pour tea from so high up?\n\n[3-15s Body]\nIt creates a foam layer called the 'regha', locking in aroma and cooling the tea...",
      caption: "The secret science of Moroccan hospitality 🍵 #morocco #travel #teatime"
    }
  ];
  localStorage.setItem('PULSE_FEED', JSON.stringify(state.feed));
}

// DOM Elements
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  updateApiKeyUI();
  renderProjects();
  renderCommunityFeed();

  // Route back / home event listeners
  btnBack.addEventListener('click', goBack);
  btnHome.addEventListener('click', () => navTo('studio', false));

  // Key save handler
  btnSaveAccountKey.addEventListener('click', () => {
    const val = accountApiKeyInput.value.trim();
    if (val) {
      state.apiKey = val;
      localStorage.setItem('PULSE_GEMINI_KEY', val);
      updateApiKeyUI();
      alert('Gemini API Key saved successfully!');
    }
  });

  // Generator submission handler
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

  // Save to Projects Handler
  btnSaveProject.addEventListener('click', () => {
    if (!state.currentOutput) return;
    state.projects.unshift(state.currentOutput);
    localStorage.setItem('PULSE_PROJECTS', JSON.stringify(state.projects));
    renderProjects();
    alert('Saved to Projects!');
  });

  // Share to Community Feed Handler
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
    alert('Published to Community Feed!');
    navTo('community');
  });
});

// Single Page Application (SPA) View Router
function navTo(viewName, addToHistory = true) {
  if (state.currentView === viewName) return;

  // Toggle visible views
  document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  // Update tab highlights
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('nav-active'));
  const activeTab = document.getElementById(`tab-${viewName}`);
  if (activeTab) activeTab.classList.add('nav-active');

  // History management for Back button
  if (addToHistory) {
    state.history.push(viewName);
  }
  state.currentView = viewName;

  // Show/Hide back button based on navigation stack
  if (state.history.length > 1) {
    btnBack.classList.remove('hidden');
  } else {
    btnBack.classList.add('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (state.history.length > 1) {
    state.history.pop();
    const previousView = state.history[state.history.length - 1];
    navTo(previousView, false);
  }
}

// API Key UI State update
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

// Gemini API Generation Logic
async function generateStudioResults(topic, audience, tone) {
  const prompt = `
You are an expert TikTok & Instagram Reels strategist.
Generate a high-converting content bundle for:
Topic: ${topic}
Target Audience: ${audience}
Tone: ${tone}

Return strict JSON ONLY matching this format (no markdown code fences):
{
  "script": "[0-3s Hook]\\n(Visual Context)\\nVoiceover text...\\n\\n[3-15s Body]\\n(Visual Context)\\nVoiceover text...\\n\\n[Call to Action]\\nVoiceover text...",
  "caption": "Catchy main post caption...",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || 'API request failed');
  }

  const result = await response.json();
  const rawText = result.candidates[0].content.parts[0].text;
  const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleanedText);
}

// Render Functions
function renderProjects() {
  const container = document.getElementById('projectsList');
  const countBadge = document.getElementById('projectCount');
  countBadge.textContent = `${state.projects.length} items`;

  if (state.projects.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-2xl p-6 text-center text-gray-400">
        <i class="fa-solid fa-folder-open text-2xl mb-2 text-gray-600"></i>
        <p class="text-xs">No saved projects yet. Generate scripts in Studio and save them here.</p>
      </div>`;
    return;
  }

  container.innerHTML = state.projects.map((p, idx) => `
    <div class="glass-card rounded-2xl p-4 flex flex-col gap-2">
      <div class="flex justify-between items-start">
        <h4 class="font-bold text-xs text-indigo-300">${escapeHtml(p.topic)}</h4>
        <button onclick="deleteProject(${idx})" class="text-gray-500 hover:text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
      <p class="text-[11px] text-gray-400 line-clamp-2 bg-gray-900/60 p-2 rounded-lg font-mono">${escapeHtml(p.script)}</p>
      <div class="flex justify-between items-center text-[10px] text-gray-500 pt-1">
        <span>${p.tone}</span>
        <button onclick="copyText('${escapeJsString(p.script)}')" class="text-indigo-400 font-semibold"><i class="fa-solid fa-copy mr-1"></i>Copy Script</button>
      </div>
    </div>
  `).join('');
}

function renderCommunityFeed() {
  const container = document.getElementById('communityFeedList');
  container.innerHTML = state.feed.map(item => `
    <div class="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold">
            ${item.author.charAt(1).toUpperCase()}
          </div>
          <span class="text-xs font-semibold text-gray-300">${item.author}</span>
        </div>
        <span class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">${item.topic}</span>
      </div>
      <p class="text-xs text-gray-300 font-mono bg-gray-900/60 p-2.5 rounded-xl border border-gray-800">${escapeHtml(item.script)}</p>
      <p class="text-[11px] text-gray-400">${escapeHtml(item.caption)}</p>
      <div class="flex justify-between items-center pt-1 border-t border-gray-800/60 text-xs">
        <button onclick="likeFeedItem('${item.id}')" class="text-gray-400 hover:text-pink-400 flex items-center space-x-1">
          <i class="fa-solid fa-heart text-pink-500"></i>
          <span>${item.likes}</span>
        </button>
        <button onclick="forkScript('${escapeJsString(item.topic)}')" class="text-xs text-indigo-400 font-semibold flex items-center space-x-1">
          <i class="fa-solid fa-bolt"></i>
          <span>Use Topic in Studio</span>
        </button>
      </div>
    </div>
  `).join('');
}

// Global Helpers
function deleteProject(index) {
  state.projects.splice(index, 1);
  localStorage.setItem('PULSE_PROJECTS', JSON.stringify(state.projects));
  renderProjects();
}

function likeFeedItem(id) {
  const item = state.feed.find(f => f.id === id);
  if (item) {
    item.likes += 1;
    localStorage.setItem('PULSE_FEED', JSON.stringify(state.feed));
    renderCommunityFeed();
  }
}

function forkScript(topic) {
  document.getElementById('topicInput').value = topic;
  navTo('studio');
}

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).textContent;
  copyText(text);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeJsString(str) {
  return (str || '').replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
