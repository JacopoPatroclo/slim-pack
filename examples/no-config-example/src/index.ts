import { createServer } from 'node:http';

function main() {
  const server = createServer((_, res) => {
    res.end('Hello, world!');
  });

  server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
  });
}

main();
