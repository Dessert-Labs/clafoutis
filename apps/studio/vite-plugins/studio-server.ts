import { generate } from '@clafoutis/generators/tailwind';
import fs from 'fs';
import type { IncomingMessage } from 'http';
import os from 'os';
import path from 'path';
import type { Plugin } from 'vite';

let cachedCSS: { baseCSS: string; darkCSS: string } | null = null;
let generateLock: Promise<void> = Promise.resolve();

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    const onData = (chunk: Buffer) => { body += chunk.toString(); };
    const onEnd = () => {
      cleanup();
      resolve(body);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      req.off('data', onData);
      req.off('end', onEnd);
      req.off('error', onError);
    };
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
  });
}

async function runGeneration(tokenFiles: Record<string, unknown>): Promise<{ baseCSS: string; darkCSS: string }> {
  const workDir = path.join(os.tmpdir(), `studio-gen-${Date.now()}`);
  fs.mkdirSync(path.join(workDir, 'tokens'), { recursive: true });

  for (const [filePath, content] of Object.entries(tokenFiles)) {
    const fullPath = path.join(workDir, 'tokens', filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  }

  try {
    await generate(workDir);

    const buildDir = path.join(workDir, 'build', 'tailwind');
    const baseCSS = fs.existsSync(path.join(buildDir, 'base.css'))
      ? fs.readFileSync(path.join(buildDir, 'base.css'), 'utf-8')
      : '';
    const darkCSS = fs.existsSync(path.join(buildDir, 'dark.css'))
      ? fs.readFileSync(path.join(buildDir, 'dark.css'), 'utf-8')
      : '';

    cachedCSS = { baseCSS, darkCSS };
    return { baseCSS, darkCSS };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export function studioServerPlugin(): Plugin {
  return {
    name: 'studio-server',
    configureServer(server) {
      server.middlewares.use('/__studio/oauth/token', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const body = await readBody(req);
        const upstream = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body,
        });
        const data = await upstream.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      });

      server.middlewares.use('/__studio/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const body = await readBody(req);
        let tokenFiles: Record<string, unknown>;
        try {
          tokenFiles = JSON.parse(body);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        const ticket = generateLock.then(() => runGeneration(tokenFiles));
        generateLock = ticket.then(() => {}, () => {});

        try {
          const result = await ticket;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (genError) {
          const errorMessage = genError instanceof Error ? genError.message : String(genError);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: { message: errorMessage },
            ...(cachedCSS || {}),
          }));
        }
      });
    },
  };
}
