// The demo shop Ship Check tests. No dependencies: a static page on localhost.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(import.meta.dirname, 'public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const port = Number(process.env.PORT || 4321);

createServer(async (req, res) => {
  const path = normalize(new URL(req.url, 'http://x').pathname).replace(/^[/\\]+/, '');
  const file = join(root, path || 'index.html');
  if (!file.startsWith(root)) return res.writeHead(403).end();
  let body;
  try {
    body = await readFile(file);
  } catch {
    return res.writeHead(404).end('not found');
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'text/plain' }).end(body);
}).listen(port, '127.0.0.1', () => console.log(`demo shop on http://127.0.0.1:${port}`));
