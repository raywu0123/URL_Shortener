import { Range } from './models/Range.js';


export default class Counter {

    constructor(charset, urlIdLen, rangeLen) {
        this.counter = -1;
        this.rangeCounter = null;

        this.charset = charset;
        this.urlIdLen = urlIdLen;
        this.rangeLen = rangeLen;
        this.counterLen = urlIdLen - rangeLen;
        this.counterMax = Math.pow(this.charset.length, this.counterLen);
    }

    async init() {
        await this.getRangeCounter_();
        console.log(`Range counter starting at ${this.rangeCounter}`);
        console.log(`COUNTER_MAX = ${this.counterMax}`);
    }

    async getRangeCounter_() {
        this.rangeCounter = (await Range.findOneAndUpdate(
            {}, 
            { $inc: { counter: 1 } },
            { upsert: 1, new: 1 },
        ).exec()).counter;
    }

    async step() {
        this.counter += 1;
        if (this.counter >= this.counterMax) {
            await this.getRangeCounter_();
            this.counter = 0;
        }
    }

    getEncoded() {
        return Counter.encode_(
            this.rangeCounter, this.rangeLen, this.charset
        ) + Counter.encode_(this.counter, this.counterLen, this.charset);
    }

    static encode_(n, len, charset) {
        if (n === 0) return "".padStart(len, charset[0]);
    
        let ret = "";
        while (n) {
            ret += charset[n % charset.length];
            n = Math.floor(n / charset.length);
        }
        return ret.padStart(len, charset[0]);
    }
}