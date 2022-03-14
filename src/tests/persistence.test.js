import { expect } from 'chai';
import mongoose from 'mongoose';

import mongo from '../mongo.js';
import redis, { redisClient } from '../redis.js';

describe('Mongo', () => {
    before(async () => {
        return await mongo.connect();
    })
    beforeEach(async () => {
        return await mongo.dropDatabase();
    })
    after(async () => {
        return await mongo.close();
    })    

    it('connected', async () => {
        expect(mongoose.connection.readyState).eq(1);
    })
})

describe('Redis', () => {
    before(async () => {
        return await redis.connect();
    })
    beforeEach(async () => {
        return await redisClient.flushall();        
    })
    after(async () => {
    })    

    it('connected', async () => {
        expect(redisClient.connected).true;
    })
})
