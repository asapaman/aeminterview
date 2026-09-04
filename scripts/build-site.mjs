import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import hljs from 'highlight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'AEM-Interview-Preparation');
const outputDir = path.join(root, 'dist');

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

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.md'))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

const allDocs = [];

for (let index = 0; index < files.length; index++) {
  const file = files[index];
  const source = await readFile(path.join(sourceDir, file), 'utf8');
  const title = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, '').trim() ?? file;
  const slug = file.replace(/\.md$/i, '').toLowerCase();
  allDocs.push({
    file,
    slug,
    title,
    number: String(index + 1).padStart(2, '0'),
    searchText: source.toLowerCase(),
    source
  });
}

const startTime = performance.now();

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'docs'), { recursive: true });

for (const document of allDocs) {
  await writeFile(path.join(outputDir, 'docs', `${document.slug}.html`), marked.parse(document.source, { renderer }));
}

await writeFile(
  path.join(outputDir, 'documents.json'),
  JSON.stringify(allDocs.map(({ source, ...document }) => document), null, 2)
);

await cp(path.join(root, 'site'), outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'CNAME'), 'docs.kumaraman.in\n');
await writeFile(path.join(outputDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const duration = (performance.now() - startTime).toFixed(2);
console.log(`Built ${allDocs.length} documents in dist/ (${duration}ms)`);