import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import mongo from './mongo.js';
import { URLId } from './models/URLId.js';
import Counter from './Counter.js';

const CHARSET = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
]
const { URL_ID_LEN, RANGE_LEN } = process.env;
const counter = new Counter(CHARSET, URL_ID_LEN, RANGE_LEN);


const app = express();
app.use(express.json());
app.post("/api/v1/urls", async (req, res) => {
    try {
        const { url, expireAt } = req.body;
        try {
            new URL(url);
        } catch {
            return res.status(403).json({ error: "invalid url" });
        }
        if (new Date(expireAt) <= new Date()) 
            return res.status(403).json({ error: "expireAt is earlier than current time." });
        
        await counter.step();
        const url_id = counter.getEncoded();
        await URLId({ url, url_id, expireAt }).save();
        res.json({
            id: url_id,
            shortenUrl: `${process.env.URL}/${url_id}`
        });
    } catch (error) {
        console.error(error);
        res.status(503).send();
    }
})

app.get("/:url_id", async (req, res) => {
    try {
        const { url_id } = req.params;
        console.log("GET", url_id);
        const doc = await URLId.findOne({ url_id }).exec();
        if (!doc || doc.expireAt <= new Date())
            return res.status(404).send();

        res.redirect(doc.url);
    } catch (error) {
        console.error(error);
        res.status(503).send();
    }
})

app.get("/", (req, res) => { res.send("Hello World!") })

async function main() {
    await mongo.connect();
    await counter.init();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

main();
