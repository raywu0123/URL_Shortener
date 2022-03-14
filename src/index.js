import express from 'express';
import dotenv from 'dotenv';

import mongo from './mongo.js';
import redis, { redisClient } from './redis.js';
import URLId from './models/URLId.js';
import Range from './models/Range.js';
import Counter, { CHARSET } from './counter.js';

dotenv.config();

const { URL_ID_LEN, RANGE_LEN } = process.env;
const counter = new Counter({
  charset: CHARSET,
  urlIdLen: URL_ID_LEN,
  rangeLen: RANGE_LEN,
  getRangeCounter: async () => (
    await Range.findOneAndUpdate(
      {},
      { $inc: { counter: 1 } },
      { upsert: 1, new: 1 },
    ).exec()
  ).counter,
});

const app = express();
app.use(express.json());
app.post('/api/v1/urls', async (req, res) => {
  try {
    const { url, expireAt } = req.body;
    try {
      URL(url);
    } catch {
      return res.status(403).json({ error: 'invalid url' });
    }
    if (new Date(expireAt) <= new Date()) { return res.status(403).json({ error: 'expireAt is earlier than current time.' }); }

    await counter.step();
    const url_id = counter.getEncoded();
    await URLId({ url, url_id, expireAt }).save();
    await redisClient.del(url_id); // invalidate cache

    res.json({
      id: url_id,
      shortUrl: `${process.env.URL}/${url_id}`,
    });
  } catch (error) {
    console.error(error);
    res.status(503).send();
  }
});

app.get('/:url_id', async (req, res) => {
  try {
    const { url_id } = req.params;

    let doc = JSON.parse(await redisClient.get(url_id));
    if (!doc) {
      doc = await URLId.findOne({ url_id }).exec();
      await redisClient.set(url_id, JSON.stringify(doc));
    }
    if (!doc || doc.expireAt <= new Date()) { return res.status(404).send(); }

    res.redirect(doc.url);
  } catch (error) {
    console.error(error);
    res.status(503).send();
  }
});

app.get('/', (req, res) => { res.send('Hello World!'); });

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
