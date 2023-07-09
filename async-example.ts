import { createAsyncFiberRoot, ref, r, use } from './src';
import { type RefObject } from './src/plugins/ref-plugin';

const add = (a: number, b: number) => a + b;

const count = r(function* () {
    const counterRef: RefObject<number> = yield ref(0);

    counterRef.current += 1;
    return counterRef.current;
});

const logRunsInParent = r(function* (name: string, parent: string) {
    const runCount: number = yield count();
    const debug = false;
    if (debug)
        console.log(`Log: ${name} ran ${runCount} times in ${parent}`);
});

const assert = r(function* (thing: unknown, type: string, parent: string) {
    yield logRunsInParent('assert', parent);
    return yield typeof thing === type;
});

const multiply = r(function* (a: number, b: number) {
    const x: number = yield add(a, 0);
    const y: number = yield add(b, 0);


    yield assert(x, 'number', 'multiply');
    yield assert(y, 'number', 'multiply');

    return x * y;
});

const divide = r(function* (x: number, y: number) {
    const a: number = yield add(0, x);
    const b: number = yield multiply(1, y);
    const d: number = yield multiply(1, y);
    const e: number = yield multiply(1, y);

    yield assert(b, 'number', 'divide');
    yield assert(d, 'number', 'divide');
    yield assert(e, 'number', 'divide');

    return a / b;
});

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// eslint-disable-next-line
// @ts-ignore
const createRandomAfterOneSecond = r(async function* () {
    await delay(1000);
    return Math.random() * 10;
});

const gen = r(function* (x: number) {
    const counterRef: RefObject<number> = yield ref(0);

    counterRef.current += 1;

    yield use(function* () {
        try {
            let i = 0;

            while (true) {
                yield [i++, Math.random()];
            }
        } finally {
            console.log('Cleanup');
        }
    });

    const a: number = yield add(counterRef.current, x);
    const b: number = yield add(counterRef.current, 3);
    const c: number = yield multiply(a, b);
    yield createRandomAfterOneSecond();
    const d: number = yield divide(8, 4);

    yield assert(d, 'number', 'gen');

    return [a, b, c, d];
});


export default function asyncExample() {
    const myGenerator = createAsyncFiberRoot(gen);
    
    const main = async () => {
        console.log(await myGenerator(1));
        console.log(await myGenerator(2));
        console.log(await myGenerator(3));
        console.log(await myGenerator(4));
        await myGenerator.dispose();
    }

    main();
}

