import * as esbuild from 'esbuild';
import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { resolvePackageNodeModulesPath } from './path-resolution.js';

/**
 * @type {(config: import('../../index.d').SlimPackConfig, dev: boolean, test: boolean) => Promise<import('esbuild').BuildContext>}
 */
export async function makeEsbuildClientContext(config, dev, test) {
  const clientDirExists = await lstat(config.clientSrcDir)
    .then(() => true)
    .catch(() => false);

  if (!clientDirExists) {
    console.warn(
      '\n[BUILD] Missing client source directory, skipping client build',
    );
    return {
      rebuild: () => Promise.resolve(),
      watch: () => Promise.resolve(),
      dispose: () => Promise.resolve(),
      serve: () => Promise.resolve(),
      cancel: () => Promise.resolve(),
    };
  }

  const userconfig = config.esbuildClientConfig({ dev });
  // Context for building the client entrypoints
  const entrypointsClient = await readdir(config.clientSrcDir);
  const ctxClient = await esbuild.context({
    bundle: true,
    minify: true,
    target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
    platform: 'browser',
    entryPoints: entrypointsClient
      .filter(
        (filename) => filename.endsWith('.ts') || filename.endsWith('.tsx'),
      )
      .map((entry) => `${config.clientSrcDir}/${entry}`),
    outdir: config.clientDist,
    sourcemap: dev || test,
    tsconfig: config.clientTsConfig,
    sourceRoot: config.clientSrcDir,
    ...userconfig,
  });
  return ctxClient;
}

/**
 * @type {(config: import('../../index.d').SlimPackConfig, dev: boolean, test: boolean) => Promise<import('esbuild').BuildContext>}
 */
export async function makeEsbuildServerContext(config, dev, test) {
  const srcDirExists = await lstat(config.serverSrcDir)
    .then(() => true)
    .catch(() => false);

  if (!srcDirExists) {
    console.error(
      `\n[BUILD] Missing server source directory, looking for ${config.serverSrcDir}`,
    );
    process.exit(1);
  }

  const userconfig = config.esbuildServerConfig({ dev });
  const ctxServer = await esbuild.context({
    entryPoints: [
      `${config.serverSrcDir}/**/*.ts`,
      `${config.serverSrcDir}/**/*.tsx`,
    ],
    outdir: config.serverDist,
    platform: 'node',
    logLevel: 'error',
    bundle: false,
    format: 'cjs',
    sourcemap: dev || test,
    tsconfig: test ? config.testTsConfig : config.serverTsConfig,
    sourceRoot: config.serverSrcDir,
    ...userconfig,
  });

  return ctxServer;
}

/**
 * @type {(config: import('../../index.d').SlimPackConfig, dev: boolean, watch: boolean) => Promise<import('child_process').ChildProcess>}
 */
export async function makeTailwindContext(config, dev, watch) {
  const tailwindConfigExists = await lstat(
    join(process.cwd(), 'tailwind.config.js'),
  )
    .then(() => true)
    .catch(() => false);

  if (!tailwindConfigExists) {
    console.warn(
      '\n[BUILD]: No tailwind.config.js file found, skipping tailwindcss bundle',
    );
    return {
      on: (event, handler) => {
        if (event === 'on') {
          handler(0);
        }
      },
      kill: () => {},
    };
  }

  const tailwindBin = `${resolvePackageNodeModulesPath()}/.bin/tailwindcss`;
  // Tailwind command to run in the background to bundle the css
  const tailwindCommand = `${tailwindBin} -i ./${config.cssEntryPoint} -o ./${config.cssDist} --minify ${watch || dev ? '--watch' : ''}`;
  const tailwind = spawn(tailwindCommand, {
    shell: true,
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  return tailwind;
}

/**
 * @type {(shouldIgnore: boolean) => { up: () => void, down: () => void}}
 */
export function makeDockerComposeContext(shouldIgnore) {
  if (shouldIgnore) {
    console.warn('\n[BUILD]: Skipping docker-compose up/down commands');
    return {
      up: () => {},
      down: () => {},
    };
  }

  return {
    up: () => {
      console.log('\n[BUILD]: Starting docker-compose services');
      execSync('docker compose up -d', {
        shell: true,
        env: process.env,
      });
    },
    down: () => {
      console.log('\n[BUILD]: Stopping docker-compose services');
      execSync('docker compose down', {
        shell: true,
        env: process.env,
      });
    },
  };
}
