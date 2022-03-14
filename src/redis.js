import redisLib from "redis";


var redis = { connect };
export var redisClient = null; 

async function connect() {
    redisClient = redisLib.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log("Redis connected!")
}

export default redis;