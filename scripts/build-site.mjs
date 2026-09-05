import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import hljs from 'highlight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'AEM-Interview-Preparation');
const outputDir = path.join(root, 'dist');

const SITE_URL = 'https://docs.kumaraman.in';
const MAIN_SITE_URL = 'https://kumaraman.in';
const SITE_NAME = 'AEM Notes';
const SITE_DESCRIPTION = 'A practical, interview-ready field guide to Adobe Experience Manager development — architecture, Sling Models, OSGi, servlets, HTL, Cloud Service, security, and system design, with real project stories and mock interviews.';

marked.setOptions({ gfm: true, breaks: false });
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const language = lang?.trim().toLowerCase();
  if (language === 'mermaid') {
    return `<div class="mermaid mermaid-block">${text}</div>`;
  }
  const syntax = language && hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(text, { language: syntax }).value;
  const displayLang = (language || 'text').toUpperCase();
  return `<div class="code-wrapper" data-lang="${displayLang}"><pre><code class="language-${syntax}">${highlighted}</code></pre></div>`;
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const HTML_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…'
};

const stripHtml = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const codePoint = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(codePoint) ? ' ' : String.fromCodePoint(codePoint);
    }
    return HTML_ENTITIES[code.toLowerCase()] ?? ' ';
  })
  .replace(/\s+/g, ' ')
  .trim();

const extractDescription = (html, fallback) => {
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => stripHtml(match[1]));
  const candidate = paragraphs.find((text) => text.length > 80 && !/^(Target:|Syllabus point|Covers from|Supplementary topic|Project domain)/i.test(text));
  const text = candidate || paragraphs.find((text) => text.length > 40) || fallback;
  return text.length > 157 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
};

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.md'))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

const allDocs = [];

for (let index = 0; index < files.length; index++) {
  const file = files[index];
  const sourceRaw = await readFile(path.join(sourceDir, file), 'utf8');
  const source = sourceRaw
    .replace(/^##\s+Next file/gm, '## Next topic')
    .replace(/\*\*`([^`]+)\.md`\*\*/g, '**`$1`**')
    .replace(/\*File (\d+)/g, '*Topic $1');
  const title = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, '').trim() ?? file;
  const slug = file.replace(/\.md$/i, '').toLowerCase();
  const bodyHtml = marked.parse(source, { renderer });
  allDocs.push({
    file,
    slug,
    title,
    number: String(index + 1).padStart(2, '0'),
    searchText: source.toLowerCase(),
    description: extractDescription(bodyHtml, title),
    bodyHtml
  });
}

const footerHtml = (relativePrefix = '') => `
    <footer class="site-footer">
      <p>AEM Notes — a field guide for AEM interview preparation. Built by <a href="${MAIN_SITE_URL}" target="_blank" rel="noopener me">Aman Kumar</a>.</p>
    </footer>`;

const renderDocPage = (doc, index) => {
  const canonical = `${SITE_URL}/docs/${doc.slug}.html`;
  const previous = allDocs[index - 1];
  const next = allDocs[index + 1];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: doc.description,
    url: canonical,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
    author: { '@type': 'Person', name: 'Aman Kumar', url: MAIN_SITE_URL }
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(doc.title)} · ${SITE_NAME}</title>
    <meta name="description" content="${escapeHtml(doc.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(doc.title)}" />
    <meta property="og:description" content="${escapeHtml(doc.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(doc.title)}" />
    <meta name="twitter:description" content="${escapeHtml(doc.description)}" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'" />
    <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../styles.css" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body data-theme="dark">
    <header class="static-page-header">
      <a class="brand" href="../"><span class="brand-mark">AEM</span><span>AEM<br /><b>NOTES</b></span></a>
      <a class="static-open-app" href="../#${encodeURIComponent(doc.slug)}">Open in the interactive study app ↗</a>
    </header>
    <main class="static-page-main">
      <p class="static-breadcrumb"><a href="../">${SITE_NAME}</a> / ${escapeHtml(doc.title)}</p>
      <article class="markdown-body">${doc.bodyHtml}</article>
      <nav class="static-pager">
        ${previous ? `<a href="${previous.slug}.html"><small>PREVIOUS TOPIC</small><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>'}
        ${next ? `<a class="next" href="${next.slug}.html"><small>NEXT TOPIC</small><strong>${escapeHtml(next.title)} →</strong></a>` : '<span></span>'}
      </nav>
    </main>${footerHtml('../')}
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js" integrity="sha384-EOXBFmc3gx5mb+vn0vPvvGqACToJD24hhacX5Yx+8NUUQrHIle/Qi5Bg9o3zKwW2" crossorigin="anonymous" defer></script>
    <script src="../mermaid-init.js" defer></script>
  </body>
</html>`;
};

const startTime = performance.now();

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'docs'), { recursive: true });
await mkdir(path.join(outputDir, 'fragments'), { recursive: true });

for (let index = 0; index < allDocs.length; index++) {
  const doc = allDocs[index];
  // Two outputs per chapter: a full, crawlable standalone page under docs/
  // (real <title>/description/canonical, meant to be indexed and linked to
  // directly), and a bare fragment under fragments/ — just the rendered
  // markdown body — which the SPA fetches and drops into #article. Keeping
  // these separate means the SPA's innerHTML swap never has to deal with a
  // full <html>/<head>/<body> document showing up inside a <div>.
  await writeFile(path.join(outputDir, 'docs', `${doc.slug}.html`), renderDocPage(doc, index));
  await writeFile(path.join(outputDir, 'fragments', `${doc.slug}.html`), doc.bodyHtml);
}

await writeFile(
  path.join(outputDir, 'documents.json'),
  JSON.stringify(allDocs.map(({ bodyHtml, ...document }) => document), null, 2)
);

await cp(path.join(root, 'site'), outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'CNAME'), 'docs.kumaraman.in\n');

await writeFile(
  path.join(outputDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

const sitemapUrls = [
  `  <url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...allDocs.map((doc) => `  <url><loc>${SITE_URL}/docs/${doc.slug}.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
];
await writeFile(
  path.join(outputDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`
);

const llmsTxt = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Chapters

${allDocs.map((doc) => `- [${doc.title}](${SITE_URL}/docs/${doc.slug}.html): ${doc.description}`).join('\n')}

## About

Maintained by Aman Kumar. Main site: ${MAIN_SITE_URL}
`;
await writeFile(path.join(outputDir, 'llms.txt'), llmsTxt);

const duration = (performance.now() - startTime).toFixed(2);
console.log(`Built ${allDocs.length} documents in dist/ (${duration}ms)`);
