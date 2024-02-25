import { parse, resolve, join } from 'path';

export function resolvePackageNodeModulesPath() {
  const currentFileDir = parse(new URL(import.meta.url).pathname).dir;
  const nodeModulesPath = join(currentFileDir, '..', '..', 'node_modules');
  return resolve(nodeModulesPath);
}
