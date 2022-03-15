import { expect } from 'chai';
import supertest from 'supertest';
import mongo from '../mongo.js';
import redis, { redisClient } from '../redis.js';

import app, { counter } from '../app.js';

async function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), t);
  });
}

const request = supertest(app);

describe('API', () => {
  before(async () => {
    await redis.connect();
    return mongo.connect();
  });
  beforeEach(async () => {
    await redisClient.flushall();
    await mongo.dropDatabase();
    await counter.init();
  });
  after(async () => mongo.close());

  it('basic', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const postRes = await request.post('/api/v1/urls').send({
      url: 'http://www.google.com',
      expireAt: date.toISOString(),
    });
    expect(postRes.status).eq(200);

    const { id, shortUrl } = postRes.body;
    expect(id).be.a('string');
    expect(shortUrl).be.a('string');

    const getRes = await request.get(`/${id}`);
    expect(getRes.status).eq(302);
    expect(getRes.header.location).eq('http://www.google.com');
  });

  it('concurrent', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const N = 100;
    const postResponses = await Promise.all(
      [...Array(N).keys()].map(async (i) => (
        request.post('/api/v1/urls').send({
          url: `http://www.google.com/${i}`,
          expireAt: date.toISOString(),
        })
      )),
    );
    expect(postResponses.every((res) => res.status === 200)).true;
    // ids are unique
    expect((new Set(postResponses.map((res) => res.body.id))).size).eq(N);

    const getResponses = await Promise.all(
      [...Array(N).keys()].map(async (i) => (
        request.get(`/${postResponses[i].body.id}`)
      )),
    );

    expect(getResponses.every((res) => res.status === 302)).true;
    expect(getResponses.every((res, i) => res.header.location === `http://www.google.com/${i}`));
  });

  it('expires', async () => {
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + 5);
    const postRes = await request.post('/api/v1/urls').send({
      url: 'http://www.google.com',
      expireAt: date.toISOString(),
    });

    await sleep(10);

    const { id } = postRes.body;
    const getRes = await request.get(`/${id}`);
    expect(getRes.status).eq(404);
  });
});
