import dotenv from 'dotenv-defaults';

import mongo from './mongo.js';
import redis from './redis.js';
import app, { counter } from './app.js';

dotenv.config();

async function main() {
  await redis.connect();
  await mongo.connect();
  await counter.init();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

main();
