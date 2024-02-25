# Slim Pack

An abstraction over esbuild to build, develop, and test server side focused node.js applications. It uses talwindcss to handle css and docker compose to spinup the infrastructure needed to run the application.

## TLDR;

The aim of this tool is to provide a series of scripts that handle all the task that you need to run when developing a node.js application. It has a lot of opinionated defaults. It expects that you are using typescript and that you are building a server side focused application. So it will expect that you are going to organize your code, separating the client side code from the server side code using separate folders. It will also expect that you are going to use three different tsconfig files, one for the client side code, one for the server side code, and one for the tests. You have to specify witch file you want to include for which build using the tsconfig option `include`. If you have a common tsconfig you can utilize the `extends` option to avoid code duplication. If the tool finds a tailwind config file in the root of your project it will use tailwind to bundle your css. If a docker compose file is foud the same will be done for docker compose.

## Installation

You can install this package using a package manager of your choiche:

```bash
pnpm add -D slim-pack
```

Now you can ivoke the commands directly or configuring them inside your package.json scripts node.

You can use it also with npx but it's not racommanded, it is better to have a shared version of your build tools with your team.

## What is included?

This package provide a series of scripts that handle all the task that you need to run when developing a node.js application. It includes:

- `slimpack`: Or the alias `sp` it the main command. By default without arguments it will bundle your project. It supports a series of options:
  - `--watch`: to run the build in watch mode.
  - `--dev`: to run the build in watch mode while starting a dev server to run your index.ts or main.ts file. If needed it will also start a docker compose file that you have in your project.
  - `--test`: to run the tests of your project. This will bundle the server side code along side the tests files and run the tests using `node --test`.
  - `--ignore-docker-compose`: you can provide this flag to ignore the starting of the docker compose file.
  - `--config`: you can provide a path to a configuration file to use instead of the default `slimpack.config.js`.

You can mix the properties, for example you can run `slimpack --test --watch` to run the tests in watch mode.

- `slimpack-e2e`: Or the alias `spe` it is a command to run the end to end tests of your project. It will take care of bundling the application and if, needed starting the docker compose file that you have in your project.

  - `--ignore-docker-compose`: you can provide this flag to ignore the starting of the docker compose file.
  - `--config`: you can provide a path to a configuration file to use instead of the default `slimpack.config.js`.

- `slimpack-key`: Or the alias `spk` uses `@fastify/secure-session` to generate a key for the secure session. It will place the key correctly serialized in the provided env file or the default one that will be `.env.local`

## Configuration

This package is configured using a `slimpack.config.js` file. This file should export an object with the following properties:

```javascript
/**
 * You can use the type utility provided by this package
 * @type {import('slim-pack').SlimPackConfig}
 */
export default {
  // Where the server side code transpiled files will be placed
  // This will be deducted from the server tsconfig outDir if present so you can omit this
  serverDist: 'build',
  // Where the client side bundled files will be placed
  // This will be deducted from the client tsconfig outDir if present so you can omit this
  clientDist: 'public/client/dist',
  // The directory where the client side entrypoints will be read from
  // This will be deducted from the client tsconfig rootDir if present so you can omit this
  clientSrcDir: 'frontend',
  // The directory where the server code is placed
  // This will be deducted from the server tsconfig rootDir if present so you can omit this
  serverSrcDir: 'server',
  // The path to the server tsconfig must be relative to where you are executing the slimpack command
  serverTsConfig: 'tsconfig.app.json',
  // The path to the client tsconfig must be relative to where you are executing the slimpack command
  clientTsConfig: 'tsconfig.client.json',
  // The path to the test tsconfig must be relative to where you are executing the slimpack command
  testTsConfig: 'tsconfig.test.json',
  // The entrypoint for the main.css file where tailwindcss is imported, see tailwind documentation
  cssEntryPoint: 'frontend/main.css',
  // Where the css file generated by tailwind will be placed
  cssDist: 'public/client/dist/main.css',
  // Here you can customize some aspects of the esbuild configuration for the server side code
  esbuildServerConfig: (opts) => ({}),
  // Here you can customize some aspects of the esbuild configuration for the client side code
  esbuildClientConfig: (opts) => ({}),
};
```

## Expectations about Tsconfigs

As mentioned above this tool will use esbuild to bundle both server side, client side and test typescript code. This tool expects that you declare three separate tsconfig files, one for the server side code, one for the client side code, and one for the tests. This is necessary both to make sure to not include test code in the production bundle and to handle different typescript configuration for the client and server side code. For example you can declare different global types or different JSX runtimes. We encourage you to use the `extends` option to avoid code duplication. By default the expected tsconfig files are `tsconfig.app.json`, `tsconfig.client.json`, and `tsconfig.test.json`. You can change this using the `slimpack.config.js` file.
This tools also read your tsconfig files to deduct the `outDir` and `rootDir` options to avoid duplication.
Keep in mind that in the case of the test tsconfig file the `outDir` and `rootDir` options are borrowed from the server tsconfig file. The only important thing is that you have to include the test files in the `include` option of the test tsconfig file. Otherwise the tests will not be transpiled. Be sure to include tests files only in the test tsconfig file, not in the server or client tsconfig files.

## Docker compose

If a docker-compose.yaml file is present in the root of your project, the `slimpack` command will start the docker compose file when you run the `--dev` options. This is useful to start the infrastructure needed to run your application. For example you can start a database or a message broker. If you don't want to start the docker compose file you can provide the `--ignore-docker-compose` flag.