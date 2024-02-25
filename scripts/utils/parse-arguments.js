import { lstat } from 'fs/promises';
import { join } from 'path';

/**
 * type {(argv: string[], help: string) => { watch: boolean, dev: boolean, test: boolean, ignoreDockerCompose: boolean, confPath: string }}
 */
export async function parseArgs(argv, helpString) {
  const watch = argv.includes('--watch');
  const dev = argv.includes('--dev');
  const test = argv.includes('--test');
  const ignoreDockerCompose = argv.includes('--ignore-docker-compose');
  const help = argv.includes('--help');
  const confPath = argv.includes('--config')
    ? argv[argv.indexOf('--config') + 1]
    : undefined;

  if (help) {
    console.log(helpString);
    process.exit(0);
  }

  if (dev && watch) {
    console.warn(
      '\n[BUILD]: Dev mode does by default is watch mode, you should pass either --dev or --watch, not both\n',
    );
  }

  const hasDockerComposeYmlFile = await lstat(
    join(process.cwd(), 'docker-compose.yml'),
  )
    .then(() => true)
    .catch(() => false);

  const hasDockerComposeYamlFile = await lstat(
    join(process.cwd(), 'docker-compose.yaml'),
  )
    .then(() => true)
    .catch(() => false);

  const hasDockerComposeFile =
    hasDockerComposeYmlFile || hasDockerComposeYamlFile;

  return {
    watch,
    ignoreDockerCompose: !hasDockerComposeFile || ignoreDockerCompose,
    dev,
    test,
    confPath,
  };
}
