import { createFiberRoot, ref, reconcile, use } from './lib.mjs';

const add = (a, b) => a + b;

const count = reconcile(function* count() {
    const counterRef = yield ref(0);

    counterRef.current += 1;
    return counterRef.current;
});

const logRunsInParent = reconcile(function* logRunsInParent(name, parent) {
    const runCount = yield count();
    const debug = false;
    if (debug)
        console.log(`Log: ${name} ran ${runCount} times in ${parent}`);
});

const assert = reconcile(function* assert(thing, type, parent) {
    yield logRunsInParent('assert', parent);
    return yield typeof thing === type;
});

const multiply = reconcile(function* multiply(a, b) {
    const x = yield add(a, 0);
    const y = yield add(b, 0);


    yield assert(x, 'number', 'multiply');
    yield assert(y, 'number', 'multiply');

    return x * y;
});

const divide = reconcile(function* divide(x, y) {
    const a = yield add(0, x);
    const b = yield multiply(1, y);
    const d = yield multiply(1, y);
    const e = yield multiply(1, y);

    yield assert(b, 'number', 'divide');
    yield assert(d, 'number', 'divide');
    yield assert(e, 'number', 'divide');

    return a / b;
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const createRandomAfterOneSecond = reconcile(async function * createRandomAfterOneSecond() {
    await delay();
    return Math.random() * 10;
});

const gen = reconcile(function* gen(x) {
    const counterRef = yield ref(0);

    counterRef.current += 1;

    const next = yield use(function*() {
        try {
            let i = 0;
    
            while (true) {
                yield [i++, Math.random()];
            }
        // TODO: implement cleanup and dispose
        // must work on conditional branches and
        // for/while loops
        // making it work in anything other than
        // the root scope where JS control flow
        // happens like on array.map is not on
        // the plans since it will lose root generator
        // context
        } finally {
            console.log('Cleanup');
        }
    });

    console.log('next', next);

    const a = yield add(counterRef.current, x);
    const b = yield add(counterRef.current, 3);
    const c = yield multiply(a, b);
    const e = yield createRandomAfterOneSecond();
    const d = yield divide(8, 4);

    yield assert(d, 'number', 'gen', e);

    return [a, b, c, d];
});

const myGenerator = createFiberRoot(gen)

const main = async () => {
    console.log(await myGenerator(1));
    console.log(await myGenerator(2));
    console.log(await myGenerator(3)); 
    console.log(await myGenerator(4));
}

main();
