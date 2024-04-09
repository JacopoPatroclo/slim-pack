import { execSync } from 'node:child_process';

export async function getNodeVersion() {
  const output = execSync('node --version');
  return output.toString().trim().split('v')[1];
}

/**
 * Returns true if the version is greater than the compare version
 * @param {string} version
 * @param {string} compare
 * @returns boolean
 */
export function versionIsGratherThan(version, compare) {
  const [major, minor, patch] = version.split('.').map((v) => parseInt(v));
  const [compareMajor, compareMinor, comparePatch] = compare
    .split('.')
    .map((v) => parseInt(v));

  if (major > compareMajor) {
    return true;
  }

  if (major === compareMajor && minor > compareMinor) {
    return true;
  }

  if (
    major === compareMajor &&
    minor === compareMinor &&
    patch >= comparePatch
  ) {
    return true;
  }

  return false;
}
