import { reconcile, createFiberRoot, ref } from './lib.mjs';

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
    myGenerator(4).then(console.log);
    myGenerator(8).then(console.log);
}

main();
