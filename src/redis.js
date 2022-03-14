import redisLib from 'redis';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// eslint-disable-next-line import/no-mutable-exports, no-var
export var redisClient = null;

async function connect() {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const redisMock = require('redis-mock');
    redisClient = redisMock.createClient();
  } else {
    redisClient = redisLib.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log('Redis connected!');
  }
}

export default { connect };
