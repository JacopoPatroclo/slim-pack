import esbuildTsPathsPlugin from 'esbuild-ts-paths';

/**
 * @type {import('../../index.d').SlimPackConfig}
 */
export default {
  serverTsConfig: 'tsconfig.app.json',
  clientTsConfig: 'tsconfig.client.json',
  testTsConfig: 'tsconfig.test.json',
  esbuildServerConfig: () => ({
    bundle: true,
    plugins: [esbuildTsPathsPlugin('tsconfig.json')],
  }),
};
