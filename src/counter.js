import { Mutex } from 'async-mutex';

export default class Counter {
  constructor({
    charset, urlIdLen, rangeLen, getRangeCounter,
  }) {
    this.mutex = new Mutex();
    this.counter = -1;
    this.rangeCounter = -1;
    this.getRangeCounter = getRangeCounter;

    this.charset = charset;
    this.urlIdLen = urlIdLen;
    this.rangeLen = rangeLen;
    this.counterLen = urlIdLen - rangeLen;
    this.counterMax = this.charset.length ** this.counterLen;
  }

  async init() {
    this.rangeCounter = await this.getRangeCounter();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Range counter starting at ${this.rangeCounter}`);
      console.log(`COUNTER_MAX = ${this.counterMax}`);
    }
  }

  async step() {
    return this.mutex.runExclusive(async () => {
      ++this.counter;
      if (this.counter === this.counterMax) {
        this.rangeCounter = await this.getRangeCounter();
        this.counter = 0;
      }
      return [this.rangeCounter, this.counter];
    });
  }

  getEncoded(rangeCounter, counter) {
    return Counter.encode_(
      rangeCounter,
      this.rangeLen,
      this.charset,
    ) + Counter.encode_(counter, this.counterLen, this.charset);
  }

  static encode_(n, len, charset) {
    if (!Number.isInteger(n)) { throw TypeError(`Expect n to be an integer, got ${n}`); }
    if (!Number.isInteger(len)) { throw TypeError(`Expect len to be an integer, got ${len}`); }
    if (!Array.isArray(charset)) { throw TypeError('Expect charset to be a number'); }

    if (n < 0) { throw Error(`Expect n to be non-negative, got ${n}`); }
    if (len <= 0) { throw Error(`Expect len to be positive, got ${len}`); }

    if (n >= charset.length ** len) { throw Error(`n (${n}) is too large, max ${charset.length ** len}`); }

    if (n === 0) return ''.padStart(len, charset[0]);

    let ret = '';
    while (n) {
      ret += charset[n % charset.length];
      // eslint-disable-next-line no-param-reassign
      n = Math.floor(n / charset.length);
    }
    ret = [...ret].reverse().join('');
    return ret.padStart(len, charset[0]);
  }
}

export const CHARSET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];
