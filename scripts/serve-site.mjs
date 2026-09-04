import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const requested = path.resolve(root, `.${requestPath}`);
    // Must be root itself or a real descendant (root + separator) — a bare
    // startsWith(root) check would also match a sibling directory whose name
    // happens to start with "dist" (e.g. ../dist-backup), letting a crafted
    // request read files outside the intended tree.
    const isInsideRoot = requested === root || requested.startsWith(root + path.sep);
    const filePath = isInsideRoot ? requested : path.join(root, 'index.html');
    const info = await stat(filePath);
    const finalPath = info.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    await access(finalPath);
    response.writeHead(200, { 'Content-Type': types[path.extname(finalPath)] ?? 'text/plain' });
    createReadStream(finalPath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
});

const startServer = (port) => {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      startServer(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, () => console.log(`AEM Notes running at http://localhost:${port}`));
};

startServer(Number(process.env.PORT) || 4173);