import { join } from 'path';

function safeGetObject(obj) {
  return obj || {};
}

/**
 * @type {() => Promise<Required<import('../../index.d').SlimPackConfig>>}
 */
export async function readConfig(confPath = 'slimpack.config.mjs') {
  const defaultConfig = {
    serverDist: 'dist',
    clientDist: 'public/dist',
    clientSrcDir: 'client',
    serverSrcDir: 'src',
    serverTsConfig: 'tsconfig.app.json',
    clientTsConfig: 'tsconfig.client.json',
    testTsConfig: 'tsconfig.test.json',
    cssEntryPoint: 'src/main.css',
    cssDist: 'public/dist/main.css',
    esbuildServerConfig: () => ({}),
    esbuildClientConfig: () => ({}),
  };

  return import(join(process.cwd(), confPath))
    .then((mod) => safeGetObject(mod.default || mod))
    .then(async (config) => {
      // Get the configured tsconfig paths
      const serverTsConfgPath =
        config.serverTsConfig || defaultConfig.serverTsConfig;
      const clientTsConfgPath =
        config.clientTsConfig || defaultConfig.clientTsConfig;

      // Try to load the json files
      const serverTsConfig = await import(
        join(process.cwd(), serverTsConfgPath),
        {
          with: { type: 'json' },
        }
      )
        .then((mod) => mod.default)
        .catch(() => ({}));
      const clientTsConfig = await import(
        join(process.cwd(), clientTsConfgPath),
        {
          with: { type: 'json' },
        }
      )
        .then((mod) => mod.default)
        .catch(() => ({}));

      return {
        ...defaultConfig,
        ...config,
        // try to deduct the server and client src dirs and out dirs from the tsconfig
        serverSrcDir:
          safeGetObject(serverTsConfig.compilerOptions).rootDir ||
          config.serverSrcDir ||
          defaultConfig.serverSrcDir,
        clientSrcDir:
          safeGetObject(clientTsConfig.compilerOptions).rootDir ||
          config.clientSrcDir ||
          defaultConfig.clientSrcDir,
        serverDist:
          safeGetObject(serverTsConfig.compilerOptions).outDir ||
          config.serverDist ||
          defaultConfig.serverDist,
        clientDist:
          safeGetObject(clientTsConfig.compilerOptions).outDir ||
          config.clientDist ||
          defaultConfig.clientDist,
      };
    })
    .then((config) => ({ ...defaultConfig, ...config }))
    .catch(() => defaultConfig);
}
