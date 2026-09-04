const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const state = { documents: [], filtered: [] };
const nav = document.querySelector('#document-nav');
const search = document.querySelector('#search');
const reader = document.querySelector('#reader');
const welcome = document.querySelector('#welcome');
const article = document.querySelector('#article');
const breadcrumbs = document.querySelector('#breadcrumbs');
const menuButton = document.querySelector('#menu-button');
const themeButton = document.querySelector('#theme-button');
const sidebarOverlay = document.querySelector('#sidebar-overlay');
const sidebar = document.querySelector('.sidebar');
const toc = document.querySelector('#toc');
const progressBar = document.querySelector('#progress-bar');
const bookmarkButton = document.querySelector('#bookmark-button');
const completeButton = document.querySelector('#complete-button');
const topButton = document.querySelector('#top-button');
const bottomButton = document.querySelector('#bottom-button');
const recentKey = 'aem-notes-recent';
let currentDoc;

const closeSidebar = () => {
  sidebar.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
};

const openSidebar = () => {
  sidebar.classList.add('open');
  if (sidebarOverlay) sidebarOverlay.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeButton.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  localStorage.setItem('aem-notes-theme', theme);
  if (currentDoc && !reader.hidden && window.mermaid) {
    setupArticleTools();
  }
};

setTheme(localStorage.getItem('aem-notes-theme') || 'dark');

const collapseKey = 'aem-notes-sidebar-collapsed';

const setSidebarCollapsed = (collapsed) => {
  const appShell = document.querySelector('.app-shell');
  const toggleBtn = document.querySelector('#sidebar-collapse-toggle');
  sidebar.classList.toggle('collapsed', collapsed);
  if (appShell) appShell.classList.toggle('sidebar-collapsed', collapsed);
  if (toggleBtn) {
    toggleBtn.textContent = collapsed ? '»' : '«';
    toggleBtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }
  localStorage.setItem(collapseKey, collapsed ? 'true' : 'false');
};

const renderDocNavLink = (doc) => {
  const cleanTitle = doc.title.replace(/^\d+[A-Z]?\s*[–-]?\s*/i, '');
  const activeClass = currentDoc && currentDoc.slug === doc.slug ? 'active' : '';
  return `<a href="docs/${encodeURIComponent(doc.slug)}.html" data-slug="${escapeHtml(doc.slug)}" data-nav-slug="${escapeHtml(doc.slug)}" class="${activeClass}"><span>${escapeHtml(doc.number)}</span><span class="nav-doc-title">${escapeHtml(cleanTitle)}</span></a>`;
};

const renderNav = () => {
  nav.innerHTML = state.filtered.map(renderDocNavLink).join('');
  const isFiltered = state.filtered.length !== state.documents.length;
  document.querySelector('#doc-count').textContent = isFiltered
    ? `${state.filtered.length} of ${state.documents.length} chapters`
    : `${state.documents.length} chapters · updated continuously`;
};

const saveRecent = (slug) => {
  const recent = JSON.parse(localStorage.getItem(recentKey) || '[]').filter((item) => item !== slug);
  localStorage.setItem(recentKey, JSON.stringify([slug, ...recent].slice(0, 3)));
};

const updateProgressAnalytics = () => {
  if (!state.documents.length) return;
  const completed = JSON.parse(localStorage.getItem('aem-notes-completed') || '[]');
  const percent = Math.round((completed.length / state.documents.length) * 100);
  const percentElem = document.querySelector('#progress-percent');
  const fillElem = document.querySelector('#progress-fill');
  if (percentElem) percentElem.textContent = `${percent}% (${completed.length}/${state.documents.length})`;
  if (fillElem) fillElem.style.width = `${percent}%`;
};

const updateStudyState = () => {
  const saved = JSON.parse(localStorage.getItem('aem-notes-saved') || '[]');
  const completed = JSON.parse(localStorage.getItem('aem-notes-completed') || '[]');
  const isSaved = saved.includes(currentDoc.slug);
  const isComplete = completed.includes(currentDoc.slug);
  bookmarkButton.textContent = isSaved ? '★ Saved for later' : '☆ Save for later';
  completeButton.textContent = isComplete ? 'Completed' : 'Mark complete';
  completeButton.classList.toggle('is-complete', isComplete);
  updateProgressAnalytics();
};

const loadDocument = async (slug) => {
  const doc = state.documents.find((item) => item.slug === slug);
  if (!doc) return;
  const index = state.documents.indexOf(doc);
  currentDoc = doc;
  saveRecent(doc.slug);
  welcome.hidden = true;
  reader.hidden = false;
  reader.classList.add('is-loading');
  document.body.classList.add('document-open');
  article.innerHTML = '<p class="loading-note">Loading chapter…</p>';
  const response = await fetch(`fragments/${doc.slug}.html`);
  const html = await response.text();
  if (currentDoc !== doc) return; // a newer navigation already started — don't overwrite it
  article.innerHTML = html;
  reader.classList.remove('is-loading');
  setupArticleTools();
  updateStudyState();
  const wordCount = article.textContent.trim().split(/\s+/).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  document.title = `${doc.title} · AEM Notes`;
  breadcrumbs.innerHTML = `<span>AEM NOTES</span><b>/</b><strong>${escapeHtml(doc.title)}</strong>`;
  document.querySelector('#reader-meta').innerHTML = `<span>CHAPTER ${escapeHtml(doc.number)} · ⏱ ${readTimeMin} MIN READ</span><span>${index + 1} OF ${state.documents.length}</span>`;
  const previous = state.documents[index - 1];
  const next = state.documents[index + 1];
  document.querySelector('#pager').innerHTML = `${previous ? `<a href="docs/${encodeURIComponent(previous.slug)}.html" data-nav-slug="${escapeHtml(previous.slug)}"><small>PREVIOUS</small><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>'}${next ? `<a class="next" href="docs/${encodeURIComponent(next.slug)}.html" data-nav-slug="${escapeHtml(next.slug)}"><small>NEXT</small><strong>${escapeHtml(next.title)} →</strong></a>` : '<span></span>'}`;
  document.querySelectorAll('#document-nav a').forEach((link) => link.classList.toggle('active', link.dataset.slug === slug));
  reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeSidebar();
  updateScrollButtons();
};

const setupArticleTools = () => {
  const headings = [...article.querySelectorAll('h2, h3')];
  toc.innerHTML = headings.length ? `<span>ON THIS PAGE</span>${headings.map((heading, index) => {
    const id = `section-${index + 1}`;
    heading.id = id;
    return `<a class="toc-${heading.tagName.toLowerCase()}" href="#${id}">${heading.textContent}</a>`;
  }).join('')}` : '';
  updateActiveToc(headings);
  article.querySelectorAll('.code-wrapper, pre:not(.mermaid-block)').forEach((container) => {
    if (container.querySelector('.copy-button')) return;
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(container.querySelector('code')?.textContent ?? '');
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy'; }, 1400);
    });
    container.append(button);
  });
  if (window.mermaid) {
    const dark = document.documentElement.dataset.theme === 'dark';
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        background: dark ? '#1b2825' : '#f5f3ed',
        primaryColor: dark ? '#243430' : '#ffffff',
        primaryTextColor: dark ? '#dfe9dc' : '#17211f',
        primaryBorderColor: dark ? '#a9b2aa' : '#68716d',
        lineColor: dark ? '#dfe9dc' : '#17211f',
        secondaryColor: dark ? '#243430' : '#ffffff',
        tertiaryColor: dark ? '#243430' : '#ffffff',
        edgeLabelBackground: 'transparent',
        labelBoxBkgColor: 'transparent',
        textColor: dark ? '#dfe9dc' : '#17211f'
      }
    });
    window.mermaid.run({ nodes: [...article.querySelectorAll('.mermaid-block')] }).catch(() => {
      article.querySelectorAll('.mermaid-block').forEach((diagram) => diagram.classList.add('diagram-fallback'));
    });
  }
};

const updateActiveToc = (headings = [...article.querySelectorAll('h2, h3')]) => {
  if (!headings.length) return;
  const threshold = 130;
  const current = headings.reduce((selected, heading) => heading.getBoundingClientRect().top <= threshold ? heading : selected, headings[0]);
  const activeLink = [...toc.querySelectorAll('a')].find((link) => link.hash === `#${current.id}`);
  toc.querySelectorAll('a').forEach((link) => link.classList.toggle('active', link === activeLink));
  if (activeLink && !activeLink.matches(':hover')) activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

const renderHomeTools = () => {
  const recent = JSON.parse(localStorage.getItem(recentKey) || '[]').map((slug) => state.documents.find((doc) => doc.slug === slug)).filter(Boolean);
  document.querySelector('#home-tools').innerHTML = `<div class="index-panel"><span class="eyebrow">Your desk</span><strong>${recent.length ? 'Continue where you left off' : 'Your study desk'}</strong>${recent.map((doc) => `<a href="docs/${encodeURIComponent(doc.slug)}.html" data-nav-slug="${escapeHtml(doc.slug)}">${escapeHtml(doc.number)} ${escapeHtml(doc.title)} <span>↗</span></a>`).join('') || '<span class="panel-note">Topics you open will appear here.</span>'}</div><div class="index-panel"><span class="eyebrow">Library index</span><strong>${state.documents.length} chapters</strong><span class="panel-note">The complete AEM interview preparation library.</span></div>`;
};

const route = () => {
  const slug = decodeURIComponent(location.hash.slice(1));
  if (slug) loadDocument(slug);
  else { welcome.hidden = false; reader.hidden = true; document.body.classList.remove('document-open'); document.title = 'AEM Notes'; }
};

fetch('documents.json').then((response) => response.json()).then((documents) => {
  state.documents = documents;
  state.filtered = documents;
  renderNav();
  renderHomeTools();
  updateProgressAnalytics();
  route();
});
search.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  state.filtered = state.documents.filter((doc) => doc.title.toLowerCase().includes(query) || doc.searchText.includes(query));
  renderNav();
  document.querySelector('#empty-state').hidden = state.filtered.length > 0;
});
search.addEventListener('keydown', (event) => { if (event.key === 'Escape') { search.value = ''; search.dispatchEvent(new Event('input')); } });
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement !== search) { event.preventDefault(); search.focus(); } });
window.addEventListener('scroll', () => updateActiveToc(), { passive: true });
const updateScrollButtons = () => {
  const scrollable = document.documentElement.scrollHeight > window.innerHeight + 40;
  const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
  topButton.hidden = window.scrollY < 500;
  bottomButton.hidden = !scrollable || nearBottom;
};
window.addEventListener('scroll', updateScrollButtons, { passive: true });
window.addEventListener('resize', updateScrollButtons, { passive: true });
topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
bottomButton.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
menuButton.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) closeSidebar();
  else openSidebar();
});
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}
themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
document.querySelector('#print-button').addEventListener('click', () => window.print());
bookmarkButton.addEventListener('click', () => { const saved = JSON.parse(localStorage.getItem('aem-notes-saved') || '[]'); const next = saved.includes(currentDoc.slug) ? saved.filter((slug) => slug !== currentDoc.slug) : [...saved, currentDoc.slug]; localStorage.setItem('aem-notes-saved', JSON.stringify(next)); updateStudyState(); });
completeButton.addEventListener('click', () => { const completed = JSON.parse(localStorage.getItem('aem-notes-completed') || '[]'); const next = completed.includes(currentDoc.slug) ? completed.filter((slug) => slug !== currentDoc.slug) : [...completed, currentDoc.slug]; localStorage.setItem('aem-notes-completed', JSON.stringify(next)); updateStudyState(); });
window.addEventListener('scroll', () => { if (!currentDoc || reader.hidden) return; const start = reader.offsetTop; const height = reader.scrollHeight - window.innerHeight; progressBar.style.width = `${Math.min(100, Math.max(0, ((window.scrollY - start) / height) * 100))}%`; });
window.addEventListener('keydown', (event) => { if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return; const index = state.documents.indexOf(currentDoc); if (event.key === 'ArrowLeft' && index > 0) location.hash = encodeURIComponent(state.documents[index - 1].slug); if (event.key === 'ArrowRight' && index < state.documents.length - 1) location.hash = encodeURIComponent(state.documents[index + 1].slug); if (event.key.toLowerCase() === 'd') themeButton.click(); });
const collapseToggleBtn = document.querySelector('#sidebar-collapse-toggle');
if (collapseToggleBtn) {
  collapseToggleBtn.addEventListener('click', () => {
    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    setSidebarCollapsed(!isCurrentlyCollapsed);
  });
}

// Restore collapsed state on startup
if (localStorage.getItem(collapseKey) === 'true') {
  setSidebarCollapsed(true);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.addEventListener('hashchange', route);

// Internal chapter links use real hrefs (docs/{slug}.html) so they're
// genuinely crawlable and work with no JS, a new tab, or a middle-click.
// For an ordinary in-app click, intercept and route through the hash-based
// SPA instead of a full page navigation.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-nav-slug]');
  if (!link) return;
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  location.hash = encodeURIComponent(link.dataset.navSlug);
});