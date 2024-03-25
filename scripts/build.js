#!/usr/bin/env node

import { spawn } from 'child_process';
import closeWithGrace from 'close-with-grace';
import { rm, watch as watchNode } from 'fs/promises';
import { readConfig } from './utils/read-config.js';
import { parseArgs } from './utils/parse-arguments.js';
import {
  makeEsbuildClientContext,
  makeEsbuildServerContext,
  makeTailwindContext,
  makeDockerComposeContext,
} from './utils/context-factory.js';

// aviable options
const { dev, test, watch, confPath, ignoreDockerCompose } = await parseArgs(
  process.argv,
  `
Usage: slimpack [Flags]
Alias: sp [Flags]
Description: Build the client and server code
Flags:
  --watch: Watch for changes in the project folders
  --dev: Build the client code with dev mode
  --test: Run the tests with node
  --ignore-docker-compose: Ignore the docker-compose.yml file
  --config: Path to the config file
`,
);

const config = await readConfig(confPath);

// Clean up the dist folders
await rm(config.clientDist, { recursive: true }).catch(() => null);
await rm(config.serverDist, { recursive: true }).catch(() => null);

// Make the esbuild context for the client
const ctxClient = await makeEsbuildClientContext(config, dev, test);

// Context for transpiling the server code
const ctxServer = await makeEsbuildServerContext(config, dev, test);

// Run tests with node test
// we do not need tailwind or client code for tests
if (test) {
  async function execTest() {
    await ctxServer.rebuild();
    const testProcess = spawn(`node --test ${config.serverDist}`, {
      shell: true,
      env: process.env,
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    function waitForTest() {
      return new Promise((res) => {
        testProcess.on('exit', () => {
          res();
        });
      });
    }

    await waitForTest();
  }

  if (watch) {
    // setup the closeWithGrace to dispose the esbuild context
    closeWithGrace({ delay: 100 }, async () => {
      await Promise.all([ctxServer.dispose(), ctxClient.dispose()]);
    });

    const watcher = watchNode(config.serverSrcDir, { recursive: true });
    await execTest();

    // watch for changes in the src folder
    // and execute the tests again when something happens
    for await (const _ of watcher) {
      // clear the console
      process.stdout.write('\x1Bc');

      // execute the tests again
      await execTest();
    }
    process.exit(0);
  } else {
    await execTest();
    process.exit(0);
  }
}

const tailwind = await makeTailwindContext(config, dev, watch);
const dockerCompose = makeDockerComposeContext(ignoreDockerCompose);

// Handle dev mode
if (dev) {
  dockerCompose.up();

  // wait for the database to start
  await new Promise((res) => setTimeout(res, 1000));

  // so we have the dist/index.js file
  await ctxServer.rebuild();

  // Start the dev server in watch mode
  const devServer = spawn(`node --watch ${config.serverDist}/index.js`, {
    shell: true,
    env: process.env,
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  // Watch infinitley for changes
  await Promise.all([ctxClient.watch(), ctxServer.watch()]);

  // When this script is killed exit cleanly without leaving any processes running
  closeWithGrace({ delay: 500 }, async () => {
    devServer.kill();
    tailwind.kill();
    dockerCompose.down();
    await Promise.all([ctxServer.dispose(), ctxClient.dispose()]);
  });
} else {
  // We can build in watch mode if needed
  if (watch) {
    // Start watching for changes
    await Promise.all[(ctxClient.watch(), ctxServer.watch())];

    closeWithGrace({ delay: 100 }, async () => {
      // we have tailwind in watch mode!!
      tailwind.kill();
      // dipose the esbuild context and watchers
      await Promise.all([ctxServer.dispose(), ctxClient.dispose()]);
    });
  } else {
    // Utility to wait for tailwind to finish
    function waitForTailwind() {
      return new Promise((res) => {
        tailwind.on('exit', (code) => {
          if (code === 0) {
            res();
          } else {
            console.error(
              '[TAILWIND]: Failed to execute tailwind see above for errors\n',
            );
            process.exit(1);
          }
        });
      });
    }

    // Parallel build client, server and tailwind
    await Promise.all[
      (ctxClient.rebuild(), ctxServer.rebuild(), waitForTailwind())
    ];
    // Dispose the esbuild context
    await Promise.all[(ctxClient.dispose(), ctxServer.dispose())];
  }
}
