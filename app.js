
const STORAGE = {
  users: 'pulse-users',
  user: 'pulse-user',
  projects: 'pulse-projects',
  saved: 'pulse-saved',
  feed: 'pulse-feed'
};

const DEFAULT_USERS = [
  { id: 1, name: 'Demo Creator', email: 'demo@pulse.app', password: 'demo123' }
];

const DEFAULT_FEED = [
  {
    id: 1,
    userName: 'Demo Creator',
    time: '2m ago',
    tag: 'Trending',
    title: 'The 10-second hook everyone ignores',
    copy: 'Small shift, huge retention. This idea turns a generic tip into a direct challenge with a clear payoff.',
    likes: 124,
    comments: 18,
    liked: false,
    saved: false
  },
  {
    id: 2,
    userName: 'Ava Bloom',
    time: '18m ago',
    tag: 'Editor pick',
    title: 'How we cut boring intros without losing trust',
    copy: 'Use a sharp hook, then show proof. The audience stays because the value arrives immediately.',
    likes: 96,
    comments: 12,
    liked: true,
    saved: true
  },
  {
    id: 3,
    userName: 'Jay Lee',
    time: '1h ago',
    tag: 'Launch',
    title: 'A creator workflow that feels social, not robotic',
    copy: 'Map script, hooks and CTA in one sequence so the content feels native to the feed instead of staged.',
    likes: 142,
    comments: 10,
    liked: false,
    saved: false
  }
];

const state = {
  currentUser: JSON.parse(localStorage.getItem(STORAGE.user) || 'null'),
  users: JSON.parse(localStorage.getItem(STORAGE.users) || JSON.stringify(DEFAULT_USERS)),
  projects: JSON.parse(localStorage.getItem(STORAGE.projects) || '[]'),
  saved: JSON.parse(localStorage.getItem(STORAGE.saved) || '[]'),
  feed: JSON.parse(localStorage.getItem(STORAGE.feed) || JSON.stringify(DEFAULT_FEED)),
  currentProjectId: null,
  mode: 'ideas',
  view: 'auth'
};

const modes = {
  ideas: {
    title: 'Viral idea generator',
    label: 'What are you exploring?',
    placeholder: 'e.g. morning routine, AI tools...',
    button: 'Generate',
    helper: 'Runs locally with sample intelligence. No API key required.'
  },
  script: {
    title: 'Full script writer',
    label: 'What is your video about?',
    placeholder: 'e.g. 5 habits that changed my life...',
    button: 'Write script',
    helper: 'Build a punchy script with hook, body, visual cues and CTA.'
  },
  captions: {
    title: 'Captions & hooks',
    label: 'What is the video topic?',
    placeholder: 'e.g. beginner morning workout...',
    button: 'Create captions',
    helper: 'Get ready-to-post hooks, captions and calls to action.'
  },
  hashtags: {
    title: 'Hashtag direction',
    label: 'Describe the video',
    placeholder: 'e.g. budget meals for students...',
    button: 'Find tags',
    helper: 'A balanced mix of broad, medium and niche discovery tags.'
  }
};

const $ = (id) => document.getElementById(id);

function persist() {
  localStorage.setItem(STORAGE.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE.projects, JSON.stringify(state.projects));
  localStorage.setItem(STORAGE.saved, JSON.stringify(state.saved));
  localStorage.setItem(STORAGE.feed, JSON.stringify(state.feed));
  if (state.currentUser) {
    localStorage.setItem(STORAGE.user, JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem(STORAGE.user);
  }
}

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function showView(name) {
  state.view = name;
  document.querySelectorAll('[data-view]').forEach((view) => {
    view.classList.toggle('hidden', view.dataset.view !== name);
  });

  if (name === 'dashboard' && state.currentUser) {
    loadDashboard();
  }
  if (name === 'account' && state.currentUser) {
    loadAccount();
  }
}

function goHome() {
  if (state.currentUser) {
    showView('dashboard');
    loadDashboard();
    return;
  }
  showView('auth');
  setAuthMode('login');
  prefillDemo();
}

function goBack() {
  if (state.view === 'project' || state.view === 'account') {
    goHome();
    return;
  }
  if (state.view === 'studio') {
    if (state.currentUser) goHome();
    else {
      showView('auth');
      setAuthMode('login');
      prefillDemo();
    }
    return;
  }
  if (state.view === 'dashboard') goHome();
}

function setAuthMode(mode) {
  const loginCard = $('authFormView');
  const signupCard = $('signupFormView');
  if (!loginCard || !signupCard) return;
  if (mode === 'signup') {
    loginCard.classList.add('hidden');
    signupCard.classList.remove('hidden');
  } else {
    loginCard.classList.remove('hidden');
    signupCard.classList.add('hidden');
  }
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'creator';
}

function buildCard(title, body, tag = '') {
  return `
    <article class="result-card">
      <h3>${title}</h3>
      ${body}
      ${tag ? `<span class="card-tag">${tag}</span>` : ''}
    </article>
  `;
}

function renderStudioMode() {
  const mode = modes[state.mode];
  if (!mode) return;
  const title = $('modeTitle');
  const label = $('topicLabel');
  const input = $('topicInput');
  const button = $('generateButton');
  const helper = $('helperText');
  if (title) title.textContent = mode.title;
  if (label) label.textContent = mode.label;
  if (input) input.placeholder = mode.placeholder;
  if (button) button.innerHTML = `${mode.button} <span>?</span>`;
  if (helper) helper.textContent = mode.helper;
}

function addResultActions(container) {
  if (!container) return;
  container.querySelectorAll('.result-card').forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'save-card';
    button.textContent = 'Save & post';
    button.addEventListener('click', () => {
      const html = card.outerHTML;
      const entry = {
        id: Date.now() + index,
        userName: state.currentUser ? state.currentUser.name : 'You',
        time: 'just now',
        tag: state.mode.toUpperCase(),
        title: card.querySelector('h3')?.textContent || 'New concept',
        copy: card.innerText.replace(/\s+/g, ' ').trim().slice(0, 180),
        likes: 0,
        comments: 0,
        liked: false,
        saved: true,
        html
      };
      state.feed.unshift(entry);
      state.saved.push(entry);
      persist();
      toast('Saved to your feed.');
      renderDashboardFeed();
    });
    card.appendChild(button);
  });
}

function generateStudioResults() {
  const topic = ($('topicInput')?.value || '').trim() || 'your niche';
  const niche = $('nicheSelect')?.value || 'Creator growth';
  const tone = $('toneSelect')?.value || 'Energetic & Fun';
  const duration = $('durationSelect')?.value || '15 sec';

  const results = {
    ideas: [
      buildCard('The unexpected 10-second rule', `<p><strong>Hook:</strong> ?You are wasting your first 10 seconds.?</p><p><strong>Concept:</strong> Show the fastest win for ${topic}, then reveal the tiny rule behind it.</p><p><strong>Format:</strong> Face-to-camera + jump cuts</p>`, 'HIGH RETENTION'),
      buildCard('Do this before you scroll', `<p><strong>Hook:</strong> ?Before your next scroll, try this.?</p><p><strong>Why it works:</strong> It feels direct, useful and immediate.</p><p><strong>Voice:</strong> ${tone} ? ${duration}</p>`, 'COMMENT BAIT'),
      buildCard('A beginner honest reset', `<p><strong>Hook:</strong> ?I wish someone told me this on day one.?</p><p><strong>Concept:</strong> Three mistakes, one fix and one question for the audience.</p><p><strong>Lane:</strong> ${niche}</p>`, 'SAVE-WORTHY')
    ],
    script: [
      buildCard('Hook ? 0:00?0:03', `<p>?If you are trying to improve ${topic}, stop doing it the complicated way.?</p><p class="helper-text">[VISUAL: Start close to camera, text lands on first beat]</p>`, `${duration} SCRIPT`),
      buildCard('Main beat ? 0:03?0:24', `<p>?Here is the simple version. First, name the one result you want. Then remove the step that feels busy. Finally, repeat the useful part until it feels boring.?</p><p class="helper-text">[VISUAL: Three quick numbered cuts with large text]</p>`, 'STRUCTURE'),
      buildCard('CTA ? final 3 seconds', `<p>?Send this to someone who needs a simpler plan, and follow for more ${niche} ideas.?</p>`, 'CALL TO ACTION')
    ],
    captions: [
      buildCard('Hook 01', `<p><strong>?The part nobody tells you about ${topic}.?</strong></p><p>Small shift, big difference. Save this for your next reset.</p><p class="helper-text">CTA: ?Which step are you trying first??</p>`, 'UNDER 150 CHARACTERS'),
      buildCard('Hook 02', `<p><strong>?I tested the popular advice so you do not have to.?</strong></p><p>Here is what actually worked, without the extra noise.</p><p class="helper-text">CTA: ?Send this to your accountability friend.?</p>`, 'RELATABLE'),
      buildCard('Hook 03', `<p><strong>?A realistic ${tone.toLowerCase()} take on ${topic}.?</strong></p><p>No perfect setup. Just a better next move.</p><p class="helper-text">CTA: ?Follow for the next part.?</p>`, 'OPTIMIZED')
    ],
    hashtags: [
      buildCard('Broad reach', `<div class="tag-cloud"><span>#fyp</span><span>#tiktoktips</span><span>#viralvideo</span><span>#creator</span><span>#content</span></div>`, 'DISCOVERY'),
      buildCard('Medium competition', `<div class="tag-cloud"><span>#${slugify(niche)}</span><span>#${slugify(tone)}</span><span>#creatorideas</span><span>#postingtips</span><span>#growwithme</span></div>`, 'TARGETED'),
      buildCard('Niche signal', `<div class="tag-cloud"><span>#${slugify(topic)}</span><span>#beginnercreator</span><span>#dailyprogress</span><span>#smartcontent</span></div><p class="helper-text">Mix 2 broad, 3 medium and 3 niche tags. Keep the caption natural.</p>`, 'SEARCH READY')
    ]
  };

  const cards = results[state.mode] || results.ideas;
  const container = $('results');
  if (!container) return;
  container.innerHTML = cards.join('');
  addResultActions(container);
}

function renderDashboardFeed() {
  const container = $('projectList');
  if (!container) return;
  const projects = state.projects.filter((project) => project.userId === state.currentUser?.id);
  const feedMarkup = state.feed.map((post) => `
    <article class="social-card" style="padding: 14px 16px; border: 1px solid rgba(148,163,184,0.18); border-radius: 18px; background: rgba(15,23,42,0.75); margin-top: 12px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="width:34px; height:34px; border-radius:50%; background: linear-gradient(135deg, #8b5cf6, #22d3ee); display:flex; align-items:center; justify-content:center; font-weight:800; color:white;">${(post.userName || 'Y').charAt(0).toUpperCase()}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700;">${post.userName}</div>
          <small style="color: var(--muted);">${post.time}</small>
        </div>
        <span class="pill">${post.tag}</span>
      </div>
      <h3 style="margin:0 0 8px; font-size: 1.02rem;">${post.title}</h3>
      <p style="margin:0 0 10px; color: var(--muted); line-height:1.55;">${post.copy}</p>
      <div style="display:flex; gap:8px; flex-wrap: wrap;">
        <button class="secondary-btn" data-like="${post.id}">${post.liked ? '? Liked' : '? Like'} ${post.likes}</button>
        <button class="secondary-btn" data-save="${post.id}">${post.saved ? 'Saved' : 'Save'}</button>
        <button class="secondary-btn" data-share="${post.id}">Share</button>
      </div>
    </article>
  `).join('');

  const projectMarkup = projects.length ? projects.map((project) => `
    <div class="project-item" style="margin-top:12px;">
      <div>
        <strong>${project.name}</strong><br>
        <span style="color: var(--muted); font-size: 0.74rem;">${project.type} ? ${project.topic || 'No topic'}</span>
      </div>
      <div class="project-actions">
        <span class="pill">${project.type}</span>
        <button class="secondary-btn" data-open="${project.id}">Open</button>
        <button class="secondary-btn" data-export="${project.id}">Export</button>
        <button class="secondary-btn" data-share="${project.id}">Share</button>
        <button class="danger" data-delete="${project.id}">Delete</button>
      </div>
    </div>
  `).join('') : '<div class="panel"><div class="small-label">No projects yet</div></div>';

  container.innerHTML = `
    <div class="panel">
      <div class="small-label">Community feed</div>
      ${feedMarkup || '<div class="panel"><div class="small-label">No posts yet</div></div>'}
    </div>
    <div class="panel" style="margin-top: 16px;">
      <div class="small-label">Your projects</div>
      ${projectMarkup}
    </div>
  `;

  container.querySelectorAll('[data-like]').forEach((button) => {
    button.addEventListener('click', () => {
      const post = state.feed.find((item) => String(item.id) === button.dataset.like);
      if (!post) return;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      persist();
      renderDashboardFeed();
    });
  });

  container.querySelectorAll('[data-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.save);
      const post = state.feed.find((item) => item.id === id);
      if (!post) return;
      post.saved = !post.saved;
      state.saved = post.saved ? [...new Set([...state.saved, id])] : state.saved.filter((item) => item !== id);
      persist();
      renderDashboardFeed();
      toast(post.saved ? 'Saved to your library.' : 'Removed from saved.');
    });
  });

  container.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', () => {
      const post = state.feed.find((item) => String(item.id) === button.dataset.share);
      if (!post) return;
      const shareText = `${post.title} ? ${post.copy}`;
      if (navigator.share) {
        navigator.share({ title: post.title, text: shareText }).catch(() => {});
      } else {
        toast(`Share: ${shareText.slice(0, 80)}...`);
      }
    });
  });

  container.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentProjectId = Number(button.dataset.open);
      showView('project');
      loadProjectEditor();
    });
  });

  container.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projects.find((item) => String(item.id) === button.dataset.export);
      if (!project) return;
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${slugify(project.name || 'project')}.json`;
      link.click();
      toast('Project exported.');
    });
  });

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!confirm('Delete this project?')) return;
      const projectId = Number(button.dataset.delete);
      state.projects = state.projects.filter((item) => item.id !== projectId);
      persist();
      renderDashboardFeed();
      toast('Project deleted.');
    });
  });
}

function renderStats() {
  const userProjects = state.currentUser ? state.projects.filter((project) => project.userId === state.currentUser.id) : [];
  const statsGrid = $('statsGrid');
  if (!statsGrid) return;
  statsGrid.innerHTML = [
    { label: 'Total projects', value: userProjects.length },
    { label: 'Exports', value: Math.min(8, userProjects.length + 2) },
    { label: 'Shares', value: Math.max(1, userProjects.length + 1) },
    { label: 'This week', value: Math.max(3, userProjects.length + 2) }
  ].map((item) => `
    <div class="stat-card">
      <div class="small-label">${item.label}</div>
      <div style="font-size:2rem; font-weight:800; margin-top:10px;">${item.value}</div>
    </div>
  `).join('');
}

function getUserProjects(userId) {
  return state.projects.filter((project) => project.userId === userId);
}

function loadDashboard() {
  if (!state.currentUser) {
    showView('auth');
    return;
  }

  renderStats();
  renderDashboardFeed();
}

function loadProjectEditor() {
  if (!state.currentUser || !state.currentProjectId) return;
  const project = state.projects.find((item) => item.id === state.currentProjectId && item.userId === state.currentUser.id);
  if (!project) return;

  if ($('projectTitle')) $('projectTitle').textContent = project.name || 'Project';
  if ($('editorName')) $('editorName').value = project.name || '';
  if ($('editorType')) $('editorType').value = project.type || 'ideas';
  if ($('editorTopic')) $('editorTopic').value = project.topic || '';
  if ($('editorNiche')) $('editorNiche').value = project.niche || '';
  if ($('editorTone')) $('editorTone').value = project.tone || '';
  if ($('editorDuration')) $('editorDuration').value = project.duration || '';
  if ($('editorPrompt')) $('editorPrompt').value = project.prompt || '';

  const blocksContainer = $('editorContent');
  if (blocksContainer) {
    const blocks = Array.isArray(project.content) ? project.content : [];
    blocksContainer.innerHTML = blocks.length ? blocks.map((block, index) => `
      <div class="content-block">
        <small>Block ${index + 1}</small>
        <input data-title="${index}" value="${block.title || ''}" />
        <textarea data-body="${index}">${block.body || ''}</textarea>
        <input data-tag="${index}" value="${block.tag || ''}" />
      </div>
    `).join('') : '<div class="content-block"><small>No content yet</small></div>';
  }
}

function loadAccount() {
  if (!state.currentUser) {
    showView('auth');
    return;
  }

  const userProjects = getUserProjects(state.currentUser.id);
  if ($('accountName')) $('accountName').textContent = state.currentUser.name;
  if ($('accountEmail')) $('accountEmail').textContent = state.currentUser.email;
  if ($('accountProjects')) $('accountProjects').textContent = String(userProjects.length);
  if ($('accountExports')) $('accountExports').textContent = String(Math.min(9, userProjects.length + 2));
  if ($('accountActive')) $('accountActive').textContent = 'Active';
}

function saveProjectFromDashboard() {
  if (!state.currentUser) return;
  const payload = {
    id: Date.now(),
    userId: state.currentUser.id,
    name: ($('projectName')?.value || '').trim() || 'Untitled project',
    type: $('projectType')?.value || 'ideas',
    topic: $('projectTopic')?.value || '',
    niche: $('projectNiche')?.value || '',
    tone: $('projectTone')?.value || 'Energetic & Fun',
    duration: $('projectDuration')?.value || '15 sec',
    prompt: $('projectPrompt')?.value || '',
    content: [{ title: 'Saved idea', body: 'Project created from dashboard.', tag: 'CREATED' }]
  };

  state.projects.unshift(payload);
  persist();
  toast('Project saved.');
  if ($('projectName')) $('projectName').value = '';
  if ($('projectTopic')) $('projectTopic').value = '';
  if ($('projectNiche')) $('projectNiche').value = '';
  if ($('projectTone')) $('projectTone').value = '';
  if ($('projectDuration')) $('projectDuration').value = '';
  if ($('projectPrompt')) $('projectPrompt').value = '';
  loadDashboard();
}

function saveProjectEditor() {
  if (!state.currentUser || !state.currentProjectId) return;
  const project = state.projects.find((item) => item.id === state.currentProjectId && item.userId === state.currentUser.id);
  if (!project) return;

  const blocks = Array.from(document.querySelectorAll('.content-block')).map((block) => ({
    title: block.querySelector('[data-title]')?.value || '',
    body: block.querySelector('[data-body]')?.value || '',
    tag: block.querySelector('[data-tag]')?.value || ''
  }));

  project.name = ($('editorName')?.value || '').trim() || project.name;
  project.type = $('editorType')?.value || project.type;
  project.topic = $('editorTopic')?.value || '';
  project.niche = $('editorNiche')?.value || '';
  project.tone = $('editorTone')?.value || '';
  project.duration = $('editorDuration')?.value || '';
  project.prompt = $('editorPrompt')?.value || '';
  project.content = blocks;

  persist();
  toast('Project updated.');
  loadDashboard();
}

function addProjectBlock() {
  const container = $('editorContent');
  if (!container) return;
  const count = document.querySelectorAll('.content-block').length;
  container.insertAdjacentHTML('beforeend', `
    <div class="content-block">
      <small>Block ${count + 1}</small>
      <input data-title="${count}" value="New idea" />
      <textarea data-body="${count}">Add your content copy here.</textarea>
      <input data-tag="${count}" value="NEW" />
    </div>
  `);
}

async function importProjectFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const payload = parsed.project || parsed;
    const project = {
      id: Date.now(),
      userId: state.currentUser?.id || 1,
      name: payload.name || file.name.replace(/\.json$/i, ''),
      type: payload.type || 'ideas',
      topic: payload.topic || '',
      niche: payload.niche || '',
      tone: payload.tone || 'Energetic & Fun',
      duration: payload.duration || '15 sec',
      prompt: payload.prompt || '',
      content: Array.isArray(payload.content) ? payload.content : []
    };

    state.projects.unshift(project);
    persist();
    loadDashboard();
    toast('Project imported.');
  } catch (error) {
    toast(error.message || 'Could not import project.');
  } finally {
    event.target.value = '';
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = ($('loginEmail')?.value || '').trim().toLowerCase();
  const password = ($('loginPassword')?.value || '').trim();

  const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!user) {
    toast('Invalid email or password.');
    return;
  }

  state.currentUser = user;
  persist();
  showView('dashboard');
}

function handleSignupSubmit(event) {
  event.preventDefault();
  const name = ($('signupName')?.value || '').trim() || 'New Creator';
  const email = ($('signupEmail')?.value || '').trim().toLowerCase();
  const password = ($('signupPassword')?.value || '').trim();

  if (!email || !password) {
    toast('Please complete your account details.');
    return;
  }
  if (state.users.some((user) => user.email.toLowerCase() === email)) {
    toast('This email already exists.');
    return;
  }

  const user = { id: Date.now(), name, email, password };
  state.users.push(user);
  state.currentUser = user;
  persist();
  showView('dashboard');
}

function prefillDemo() {
  const loginEmail = $('loginEmail');
  const loginPassword = $('loginPassword');
  if (loginEmail) loginEmail.value = 'demo@pulse.app';
  if (loginPassword) loginPassword.value = 'demo123';
}

function bindStudio() {
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      state.mode = tab.dataset.mode;
      renderStudioMode();
    });
  });

  const generateButton = $('generateButton');
  if (generateButton) generateButton.addEventListener('click', generateStudioResults);

  const topicInput = $('topicInput');
  if (topicInput) topicInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') generateStudioResults(); });

  const settingsButton = $('settingsButton');
  if (settingsButton) settingsButton.addEventListener('click', () => toast('Demo mode is ready. No API key needed.'));

  const savedButton = $('savedButton');
  if (savedButton) savedButton.addEventListener('click', () => {
    const container = $('results');
    if (!container) return;
    const saved = state.saved.length ? state.saved : getSavedItems();
    container.innerHTML = saved.length ? saved.map((item) => item.html || buildCard(item.title, `<p>${item.copy}</p>`, item.tag)).join('') : buildCard('Nothing saved yet', '<p>Generate content and tap Save to keep it.</p>');
  });

  const infoButton = $('infoButton');
  if (infoButton) infoButton.addEventListener('click', () => toast('Pulse Studio runs locally and stays mobile-first.'));

  renderStudioMode();
}

function getSavedItems() {
  return state.saved;
}

function bindApp() {
  const loginForm = $('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const signupForm = $('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);

  if ($('showSignupBtn')) $('showSignupBtn').addEventListener('click', () => setAuthMode('signup'));
  if ($('showLoginBtn')) $('showLoginBtn').addEventListener('click', () => setAuthMode('login'));
  if ($('openStudioBtn')) $('openStudioBtn').addEventListener('click', () => { showView('studio'); });
  if ($('openStudioFromDashboard')) $('openStudioFromDashboard').addEventListener('click', () => { showView('studio'); });
  if ($('dashboardHomeButton')) $('dashboardHomeButton').addEventListener('click', goHome);
  if ($('studioBackButton')) $('studioBackButton').addEventListener('click', goBack);
  if ($('studioHomeButton')) $('studioHomeButton').addEventListener('click', goHome);
  if ($('projectBackButton')) $('projectBackButton').addEventListener('click', goBack);
  if ($('projectHomeButton')) $('projectHomeButton').addEventListener('click', goHome);
  if ($('openAccountBtn')) $('openAccountBtn').addEventListener('click', () => { showView('account'); loadAccount(); });
  if ($('accountBackBtn')) $('accountBackBtn').addEventListener('click', () => { showView('dashboard'); loadDashboard(); });
  if ($('accountHomeButton')) $('accountHomeButton').addEventListener('click', goHome);

  document.querySelectorAll('#logoutBtn').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentUser = null;
      persist();
      showView('auth');
      setAuthMode('login');
      prefillDemo();
    });
  });

  const saveProjectBtn = $('saveProjectBtn');
  if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProjectFromDashboard);

  const editorSaveBtn = $('saveProjectEditorBtn');
  if (editorSaveBtn) editorSaveBtn.addEventListener('click', saveProjectEditor);

  const backBtn = $('backToDashboard');
  if (backBtn) backBtn.addEventListener('click', () => { showView('dashboard'); loadDashboard(); });

  const addBlockBtn = $('addBlockBtn');
  if (addBlockBtn) addBlockBtn.addEventListener('click', addProjectBlock);

  const importBtn = $('importProjectBtn');
  if (importBtn) importBtn.addEventListener('click', () => $('importProjectFile')?.click());

  const fileInput = $('importProjectFile');
  if (fileInput) fileInput.addEventListener('change', importProjectFile);

  bindStudio();
}

function initApp() {
  if (!state.users.length) {
    state.users = [...DEFAULT_USERS];
  }
  bindApp();
  showView('auth');
  setAuthMode('login');
  prefillDemo();
}

document.addEventListener('DOMContentLoaded', initApp);
