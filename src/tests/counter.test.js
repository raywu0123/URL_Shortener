import { expect } from "chai";
import Counter from "../counter.js";

describe("Counter", () => {
    it("encode", () => {
        expect(Counter.encode_(0, 1, ["A", "B", "C"])).eq("A");
    })
    it('n too large', () => {
        expect(() => {
            Counter.encode_(3, 1, ["A", "B", "C"])
        }).to.throw("n is too large");
    })

    it("basic counter", async () => {
        let rangeCounter = -1;
        const counter = new Counter({
            charset: ["A", "B", "C"],
            urlIdLen: 3,
            rangeLen: 1,
            getRangeCounter: () => ++rangeCounter,
        });
        await counter.init();
        await counter.step();
        expect(counter.getEncoded()).eq("AAA");

        for(let i = 0; i < 9 - 1; i++) {
            await counter.step();
        }
        expect(counter.getEncoded()).eq("ACC");
        
        await counter.step();
        expect(rangeCounter).eq(1);
        expect(counter.getEncoded()).eq("BAA");
    })
})