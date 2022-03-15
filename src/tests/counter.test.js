import { expect } from 'chai';
import Counter from '../counter.js';

describe('Counter', () => {
  it('encode', () => {
    expect(Counter.encode_(0, 1, ['A', 'B', 'C'])).eq('A');
  });
  it('n too large', () => {
    expect(() => {
      Counter.encode_(3, 1, ['A', 'B', 'C']);
    }).to.throw('n (3) is too large, max 3');
  });

  it('basic counter', async () => {
    let rangeCounter = -1;
    const counter = new Counter({
      charset: ['A', 'B', 'C'],
      urlIdLen: 3,
      rangeLen: 1,
      getRangeCounter: () => ++rangeCounter,
    });
    await counter.init();

    let counterState = await counter.step();
    expect(counter.getEncoded(...counterState)).eq('AAA');

    for (let i = 0; i < 9 - 1; i++) {
      counterState = await counter.step();
    }
    expect(counter.getEncoded(...counterState)).eq('ACC');

    counterState = await counter.step();
    expect(rangeCounter).eq(1);
    expect(counter.getEncoded(...counterState)).eq('BAA');
  });

  it('concurrent counter steps', async () => {
    const charset = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const urlIdLen = 4;
    let rangeCounter = -1;
    const counter = new Counter({
      charset,
      urlIdLen,
      rangeLen: urlIdLen - 1,
      getRangeCounter: () => ++rangeCounter,
    });
    await counter.init();

    const N = charset.length ** urlIdLen;
    const encs = await Promise.all(
      [...Array(N).keys()].map(async () => {
        const counterState = await counter.step();
        const enc = counter.getEncoded(...counterState);
        return enc;
      }),
    );
    expect((new Set(encs)).size).eq(N);
  });
});
