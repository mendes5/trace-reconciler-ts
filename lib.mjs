const getStackFrame = (depth) =>
    `${new Error().stack.split('\n')[depth].trim().split('/').slice(-1)[0]}`;

const OneShotFiberReconciledGenerator = Symbol('FiberReconciledGenerator');

// TODO: create other "styles" of generators 
// for example, one that is an infinite while
// loop, that each call runs one iteration
// currently only OneShot is implemented.
export const reconcile = fn => (...args) => {
    // 0 Error Object
    // 1 GetStackFrame
    // 2 This Function
    // 3 Parent Function
    const recordedPosition = getStackFrame(3);

    function* hackGenerator() {
        const gen = fn(...args);
        gen.recordedPosition = recordedPosition;
        gen.type = OneShotFiberReconciledGenerator;
        gen.name = fn.name;

        return gen;
    }
    return hackGenerator();
};

const Ref = Symbol('Ref');

// Like useRef from react
// Keeps a mutable cell alive between reconciliations 
export const ref = reconcile(function* ref(current) {
    // This is the way we communicate with the runtime
    // yield symbols to the root, so we can
    // avoid passing context objects around or
    // creating mutable global variables.
    //
    // Users could also do stuff like
    // `yield { WebGPU, createBuffer: { size, usage, label } }` 
    // to do operations on resources without having references to
    // it directly
    return yield { Ref, initial: { current } };
});

// TODO: create async and sync versions
const handleGenericGenerator = async (generator, ctx) => {
    if (generator.recordedPosition) {
        ctx.thread.push(generator.recordedPosition);
        ctx.depth++;
    }

    try {
        if (generator.toString() === '[object Generator]' || generator.toString() === '[object AsyncGenerator]') {
            let last;
            do {
                last = await generator.next(last?.value);

                if (typeof last?.value?.type === 'symbol' || last?.value?.toString() === '[object Generator]' || last?.value?.toString() === '[object AsyncGenerator]') {
                    last.value = await handleGenericGenerator(last.value, ctx);
                } else if (last.value?.Ref === Ref) {
                    const callStackCacheKey = ctx.thread.join('@');

                    const cached = ctx.cache.get(callStackCacheKey);

                    if (cached) {
                        last.value = cached.initial;
                    } else {
                        ctx.cache.set(callStackCacheKey, last.value)
                        last.value = last.value.initial;
                    }
                }
            } while (last.done === false);
            return last.value;
        } else {
            console.log(generator);
            throw new Error(`Unknown generator type: ${generator.type}`);
        }
    } finally {
        if (generator.recordedPosition) {
            ctx.depth--;
            ctx.thread.pop();
        }
    }
};

export const createFiberRoot = (gen) => {
    const ctx = {
        calls: 0,
        depth: 0,
        thread: [],
        record: [],
        // TODO: order map by call stack position
        // and depth, so we might run cleanup
        cache: new Map(),
    };

    const lock = { current: null };

    // TODO: implement dispose
    return async (...args) => {
        if (lock.current) {
            await lock.current;
        }
        lock.current = handleGenericGenerator(gen(...args), ctx);
        const result = await lock.current;
        lock.current = null;
        return result;
    };
};
