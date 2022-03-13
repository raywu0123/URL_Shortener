import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import mongo from './mongo.js';
import { Range } from './models/Range.js';
import { URLId } from './models/URLId.js';

let rangeCounter = null;
let counter = -1;

const { URL_ID_LEN, RANGE_LEN } = process.env;
const COUNTER_LEN = URL_ID_LEN - RANGE_LEN;
const CHARSET = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
]
const COUNTER_MAX = Math.pow(CHARSET.length, COUNTER_LEN);
function encode(n, len, charset) {
    if (n === 0) return "".padStart(len, charset[0]);

    let ret = "";
    while (n) {
        ret += charset[n % charset.length];
        n = Math.floor(n / charset.length);
    }
    return ret.padStart(len, charset[0]);
}

async function getRangeCounter() {
    rangeCounter = (await Range.findOneAndUpdate(
        {}, 
        { $inc: { counter: 1 } },
        { upsert: 1, new: 1 },
    ).exec()).counter;
}

const app = express();
app.use(express.json());
app.post("/api/v1/urls", async (req, res) => {
    try {
        const { url, expireAt } = req.body;
        if (new Date(expireAt) <= new Date()) 
            return res.status(403).json({ error: "expireAt is earlier than current time." });
        
        counter += 1;
        if (counter >= COUNTER_MAX) {
            await getRangeCounter();
            counter = 0;
        }
        const url_id = encode(rangeCounter, RANGE_LEN, CHARSET) + encode(counter, COUNTER_LEN, CHARSET);
        await URLId({ url, url_id, expireAt }).save();
        res.json({
            id: url_id,
            shortenUrl: `${process.env.URL}/${url_id}`
        });
    } catch (error) {
        console.error(error);
        res.status(503);
    }
})

app.get("/", (req, res) => {res.send("Hello World!")})

async function main() {
    await mongo.connect();
    await getRangeCounter();
    console.log(`Range counter starting at ${rangeCounter}`);
    console.log(`COUNTER_MAX = ${COUNTER_MAX}`);
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

main();
