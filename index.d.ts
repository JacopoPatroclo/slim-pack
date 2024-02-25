import { BuildOptions } from 'esbuild';

export interface SlimPackConfig {
  serverDist?: string;
  clientDist?: string;
  clientSrcDir?: string;
  serverSrcDir?: string;
  serverTsConfig?: string;
  clientTsConfig?: string;
  testTsConfig?: string;
  cssEntryPoint?: string;
  cssDist?: string;
  esbuildServerConfig?: (opts: { dev: boolean }) => BuildOptions;
  esbuildClientConfig?: (opts: { dev: boolean }) => BuildOptions;
}
