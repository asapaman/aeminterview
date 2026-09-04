const state = { documents: [], filtered: [] };
const nav = document.querySelector('#document-nav');
const search = document.querySelector('#search');
const reader = document.querySelector('#reader');
const welcome = document.querySelector('#welcome');
const article = document.querySelector('#article');
const breadcrumbs = document.querySelector('#breadcrumbs');
const menuButton = document.querySelector('#menu-button');
const themeButton = document.querySelector('#theme-button');

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeButton.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  localStorage.setItem('aem-notes-theme', theme);
};

setTheme(localStorage.getItem('aem-notes-theme') || 'light');

const renderNav = () => {
  nav.innerHTML = state.filtered.map((doc) => `<a href="#doc-${doc.slug}" data-slug="${doc.slug}"><span>${doc.number}</span>${doc.title.replace(/^\d+\s*[–-]?\s*/, '')}</a>`).join('');
  document.querySelector('#doc-count').textContent = `${state.documents.length} chapters · updated continuously`;
};

const loadDocument = async (slug) => {
  const doc = state.documents.find((item) => item.slug === slug);
  if (!doc) return;
  const index = state.documents.indexOf(doc);
  const response = await fetch(`docs/${doc.slug}.html`);
  article.innerHTML = await response.text();
  document.title = `${doc.title} · AEM Field Notes`;
  breadcrumbs.innerHTML = `<span>AEM FIELD NOTES</span><b>/</b><strong>${doc.title}</strong>`;
  document.querySelector('#reader-meta').innerHTML = `<span>CHAPTER ${doc.number}</span><span>${index + 1} OF ${state.documents.length}</span>`;
  const previous = state.documents[index - 1];
  const next = state.documents[index + 1];
  document.querySelector('#pager').innerHTML = `${previous ? `<a href="#doc-${previous.slug}"><small>PREVIOUS</small><strong>← ${previous.title}</strong></a>` : '<span></span>'}${next ? `<a class="next" href="#doc-${next.slug}"><small>NEXT</small><strong>${next.title} →</strong></a>` : '<span></span>'}`;
  welcome.hidden = true;
  reader.hidden = false;
  document.querySelectorAll('#document-nav a').forEach((link) => link.classList.toggle('active', link.dataset.slug === slug));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('.sidebar').classList.remove('open');
};

const route = () => {
  const slug = location.hash.replace('#doc-', '');
  if (slug) loadDocument(slug);
  else { welcome.hidden = false; reader.hidden = true; document.title = 'AEM Field Notes'; }
};

fetch('documents.json').then((response) => response.json()).then((documents) => {
  state.documents = documents;
  state.filtered = documents;
  renderNav();
  route();
});
search.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  state.filtered = state.documents.filter((doc) => doc.title.toLowerCase().includes(query));
  renderNav();
  document.querySelector('#empty-state').hidden = state.filtered.length > 0;
});
search.addEventListener('keydown', (event) => { if (event.key === 'Escape') { search.value = ''; search.dispatchEvent(new Event('input')); } });
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement !== search) { event.preventDefault(); search.focus(); } });
menuButton.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
window.addEventListener('hashchange', route);