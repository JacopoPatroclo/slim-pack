import { createServer } from 'node:http';
import { sayHello } from '@/otherfile';

function main() {
  const server = createServer((_, res) => {
    res.end(sayHello());
  });

  server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
  });
}

main();
