import redisLib from "redis";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const redis = { connect };
export var redisClient = null; 

async function connect() {
    if (process.env.NODE_ENV === 'test') {
        const redisMock = require('redis-mock');
        redisClient = redisMock.createClient();
    } else {
        redisClient = redisLib.createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
        console.log("Redis connected!")    
    }
}

export default redis;