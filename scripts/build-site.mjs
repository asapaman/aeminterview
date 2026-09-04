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
    return `<pre class="mermaid-block"><code>${text}</code></pre>`;
  }
  const syntax = language && hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(text, { language: syntax }).value;
  const className = language ? ` class="language-${language}"` : '';
  return `<pre><code${className}>${highlighted}</code></pre>`;
};

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.md'))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

const documents = await Promise.all(files.map(async (file, index) => {
  const source = await readFile(path.join(sourceDir, file), 'utf8');
  const title = source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, '').trim() ?? file;
  const slug = file.replace(/\.md$/i, '').toLowerCase();
  return { file, slug, title, number: String(index + 1).padStart(2, '0'), source };
}));

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'docs'), { recursive: true });
for (const document of documents) {
  await writeFile(path.join(outputDir, 'docs', `${document.slug}.html`), marked.parse(document.source, { renderer }));
}
await writeFile(path.join(outputDir, 'documents.json'), JSON.stringify(documents.map(({ source, ...document }) => document), null, 2));
await cp(path.join(root, 'site'), outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'CNAME'), 'docs.kumaraman.in\n');
console.log(`Built ${documents.length} documents in dist/`);