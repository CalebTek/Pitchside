#!/usr/bin/env node
/**
 * Renders every docs/diagrams/src/*.mmd file to a PNG and syncs it into the Markdown docs.
 *
 * In a doc, place an empty marker pair where the diagram should appear:
 *   <!-- diagram:flow-launch -->
 *   <!-- /diagram -->
 * The script fills it with the rendered image and a collapsible copy of the Mermaid source.
 * Images display everywhere (GitHub app, VS Code, PDF export); the source keeps it editable.
 *
 * Usage:
 *   npm run docs:diagrams                 # render PNGs + sync Markdown
 *   npm run docs:diagrams -- --no-render  # only sync Markdown
 *   CHROME_PATH=/path/to/chrome npm run docs:diagrams   # use an installed Chrome
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const docsDir = join(root, 'docs');
const srcDir = join(docsDir, 'diagrams', 'src');
const outDir = join(docsDir, 'diagrams');
const render = !process.argv.includes('--no-render');

const sources = Object.fromEntries(
  readdirSync(srcDir)
    .filter((f) => f.endsWith('.mmd'))
    .map((f) => [f.replace(/\.mmd$/, ''), readFileSync(join(srcDir, f), 'utf8').trimEnd()]),
);

if (render) {
  const args = [];
  if (process.env.CHROME_PATH) {
    const cfg = join(mkdtempSync(join(tmpdir(), 'mmd-')), 'puppeteer.json');
    writeFileSync(cfg, JSON.stringify({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }));
    args.push('-p', cfg);
  }
  for (const name of Object.keys(sources)) {
    process.stdout.write(`render ${name} … `);
    execFileSync(
      'npx',
      ['-y', '@mermaid-js/mermaid-cli@11', ...args, '-i', join(srcDir, `${name}.mmd`), '-o', join(outDir, `${name}.png`), '-b', 'white', '-s', '2'],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    console.log('ok');
  }
}

const marker = /<!-- diagram:([\w-]+) -->[\s\S]*?<!-- \/diagram -->/g;
const used = new Set();
for (const file of readdirSync(docsDir).filter((f) => f.endsWith('.md'))) {
  const path = join(docsDir, file);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(marker, (_, name) => {
    if (!sources[name]) throw new Error(`${file}: no source docs/diagrams/src/${name}.mmd`);
    if (!existsSync(join(outDir, `${name}.png`))) throw new Error(`Missing docs/diagrams/${name}.png — run without --no-render`);
    used.add(name);
    return [
      `<!-- diagram:${name} -->`,
      `![${name}](diagrams/${name}.png)`,
      '',
      `<details><summary>Mermaid source (<code>diagrams/src/${name}.mmd</code>)</summary>`,
      '',
      '```mermaid',
      sources[name],
      '```',
      '',
      '</details>',
      '<!-- /diagram -->',
    ].join('\n');
  });
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`synced ${file}`);
  }
}

const unused = Object.keys(sources).filter((n) => !used.has(n));
if (unused.length) console.warn(`Not referenced in any doc: ${unused.join(', ')}`);
