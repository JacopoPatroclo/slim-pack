#!/usr/bin/env node

import { execSync } from 'child_process';
import { appendFile, readFile } from 'fs/promises';
import { resolvePackageNodeModulesPath } from './utils/path-resolution.js';

const help = process.argv.includes('--help');

if (help) {
  console.log(`
Usage: slimpack-key [envFile]
Description: Generate a secure session key and append it to the given env file.
If no env file is given, it will default to .env.local
`);
  process.exit(0);
}

// Get env file from args
const envFile = process.argv[2] || '.env.local';

// Check if key already exists
const hasAlreadyKey = await readFile(envFile).catch(() => '');
if (hasAlreadyKey.includes('COOKIE_SECRET')) {
  console.log(`Key already exists in ${envFile}, skipping...`);
  process.exit(0);
}

// Using genkey.js from @fastify/secure-session
// see https://github.com/fastify/fastify-secure-session
const keybuffer = execSync(
  `node ${resolvePackageNodeModulesPath}/@fastify/secure-session/genkey.js`,
  {
    shell: true,
  },
);

await appendFile(envFile, `COOKIE_SECRET=${keybuffer.toString('hex')}\n`);
