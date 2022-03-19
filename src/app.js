import express from 'express';
import dotenv from 'dotenv-defaults';

import { redisClient } from './redis.js';
import URLId from './models/URLId.js';
import Range from './models/Range.js';
import Counter, { CHARSET } from './counter.js';

dotenv.config();
const { URL_ID_LEN, RANGE_LEN } = process.env;
export const counter = new Counter({
  charset: CHARSET,
  urlIdLen: Number(URL_ID_LEN),
  rangeLen: Number(RANGE_LEN),
  getRangeCounter: async () => {
    const prevRange = await Range.findOneAndUpdate(
      {},
      { $inc: { counter: 1 } },
      { upsert: 1 },
    ).exec();
    if (prevRange === null) return 0;
    return prevRange.counter + 1;
  },
});

const app = express();
app.use(express.json());
app.post('/api/v1/urls', async (req, res) => {
  try {
    const { url, expireAt } = req.body;
    try {
      new URL(url);
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: 'invalid url' });
    }
    if (new Date(expireAt) <= new Date()) { return res.status(403).json({ error: 'expireAt is earlier than current time.' }); }

    const counterState = await counter.step();
    const url_id = counter.getEncoded(...counterState);
    await URLId({ url, url_id, expireAt }).save();
    await redisClient.del(url_id); // invalidate cache

    res.json({
      id: url_id,
      shortUrl: `${req.protocol}://${req.get('host')}/${url_id}`,
    });
  } catch (error) {
    console.error(error);
    res.status(503).send();
  }
});

app.get('/:url_id', async (req, res) => {
  try {
    const { url_id } = req.params;
    const cachedValue = await redisClient.get(url_id);
    let doc = !cachedValue || JSON.parse(cachedValue);
    if (!cachedValue) {
      doc = await URLId.findOne({ url_id }).exec();
      await redisClient.set(url_id, JSON.stringify(doc));
    }
    if (!doc) { return res.status(404).json({ error: 'url_id not found' }); }

    const now = new Date();
    if (doc.expireAt <= now) { return res.status(404).send({ error: 'expired' }); }
    res
      .set('Cache-control', `public, max-age=${Math.floor((new Date(doc.expireAt) - now) / 1000)}`)
      .redirect(doc.url);
  } catch (error) {
    console.error(error);
    res.status(503).send();
  }
});

app.get('/', (req, res) => {
  res
    .set('Cache-control', 'public, max-age=300')
    .send('Hello World!');
});

export default app;
