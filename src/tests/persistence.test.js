import { expect } from 'chai';
import mongoose from 'mongoose';

import mongo from '../mongo.js';
import redis, { redisClient } from '../redis.js';

describe('Mongo', () => {
  before(async () => mongo.connect());
  beforeEach(async () => mongo.dropDatabase());
  after(async () => mongo.close());

  it('connected', async () => {
    expect(mongoose.connection.readyState).eq(1);
  });
});

describe('Redis', () => {
  before(async () => redis.connect());
  beforeEach(async () => redisClient.flushall());
  after(async () => {
  });

  it('connected', async () => {
    expect(redisClient.connected).true;
  });
});
