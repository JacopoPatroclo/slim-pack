#!/usr/bin/env node

import { exec, execSync } from 'child_process';
import { join } from 'path';
import { parseArgs } from './utils/parse-arguments.js';
import { lstat } from 'fs/promises';
import { makeDockerComposeContext } from './utils/context-factory.js';

const { watch, ignoreDockerCompose } = await parseArgs(
  process.argv,
  `
Usage: slimpack-e2e [Flags]
Alias: spe [Flags]
Description: Run the end-to-end tests using cypress
Flags:
  --watch: Open cypress in editor mode
  --ignore-docker-compose: Ignore the docker-compose.yml file and do not start the docker compose services
`,
);

const cypreccConfigTsExists = await lstat(
  join(process.cwd(), 'cypress.config.ts'),
)
  .then(() => true)
  .catch(() => false);

const cypreccConfigJsExists = await lstat(
  join(process.cwd(), 'cypress.config.js'),
)
  .then(() => true)
  .catch(() => false);

if (!cypreccConfigTsExists && !cypreccConfigJsExists) {
  console.error(
    'No cypress.config.ts or cypress.config.js file found, make sure you have cypress configured in your project',
  );
  console.error(
    `We have looked for cypress.config.ts and cypress.config.js in ${process.cwd()}`,
  );
  process.exit(1);
}

const dockerCompose = makeDockerComposeContext(ignoreDockerCompose);

dockerCompose.up();

const packageJson = await import(join(process.cwd(), 'package.json'), {
  with: { type: 'json' },
});

const buildScript = packageJson.default.scripts.build;
const startScript = packageJson.default.scripts.start;

if (!buildScript) {
  console.error('No build script found in package.json');
  process.exit(1);
}

if (!startScript) {
  console.error('No start script found in package.json');
  process.exit(1);
}

// Build the app
execSync(buildScript, { shell: true, stdio: 'inherit', env: process.env });

// Start the dev server
const devServer = exec(startScript, {
  shell: true,
  stdio: 'pipe',
  env: process.env,
});

devServer.stdout.pipe(process.stdout);
devServer.stderr.pipe(process.stderr);

// Wait for the dev server to be ready
await new Promise((resolve) => {
  devServer.stdout.on('data', (data) => {
    if (data.includes('Server listening on')) {
      resolve();
    }
  });
});

// Run the e2e tests
const rootNodeModules = join(process.cwd(), 'node_modules');
const cypressbin = `${rootNodeModules}/.bin/cypress`;
const cypress = exec(`${cypressbin} ${watch ? 'open' : 'run'}`, {
  shell: true,
  stdio: 'pipe',
  env: process.env,
});

cypress.stdout.pipe(process.stdout);
cypress.stderr.pipe(process.stderr);

cypress.on('exit', (code) => {
  console.log('Tests have finished with code ' + code);
  // Stop the dev server
  devServer.kill();
  dockerCompose.down();
  process.exit(code);
});
