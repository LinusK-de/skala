#!/usr/bin/env node
/**
 * Initialize a new app generated from this template: rename the placeholders
 * (app name, slug, scheme, local DB filename) across the project.
 *
 * Usage:
 *   node scripts/init-app.mjs --name "Body Track" --slug body-track --scheme bodytrack
 *
 * --scheme is optional; it defaults to the slug with dashes removed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

function arg(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

const name = arg('--name');
const slug = arg('--slug');
const scheme = arg('--scheme') ?? slug?.replace(/-/g, '');

if (!name || !slug) {
  console.error(
    'Usage: node scripts/init-app.mjs --name "App Name" --slug app-slug [--scheme appscheme]',
  );
  exit(1);
}

function edit(path, fn) {
  const before = readFileSync(path, 'utf8');
  writeFileSync(path, fn(before));
  console.log('updated', path);
}

// app.json — name, slug, scheme
edit('app.json', (s) => {
  const j = JSON.parse(s);
  j.expo.name = name;
  j.expo.slug = slug;
  j.expo.scheme = scheme;
  return JSON.stringify(j, null, 2) + '\n';
});

// package.json — package name
edit('package.json', (s) => {
  const j = JSON.parse(s);
  j.name = slug;
  return JSON.stringify(j, null, 2) + '\n';
});

// src/db/client.ts — local SQLite filename
edit('src/db/client.ts', (s) =>
  s.replace(/openDatabaseSync\('[^']*'/, `openDatabaseSync('${slug.replace(/-/g, '_')}.db'`),
);

// README.md — title
edit('README.md', (s) => s.replace(/^# .*/m, `# ${name}`));

console.log(`\nDone. "${name}" is ready.\nNext: npm install && npm run db:generate && npm start`);
