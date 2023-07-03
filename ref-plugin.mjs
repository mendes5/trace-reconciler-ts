import { reconcile } from "./core.mjs";

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

export const refPlugin = (ctx) => {
    ctx.cache = new Map();

    return {
        matches: (value) => value.Ref === Ref,
        exec: (value, ctx) => {
            const callStackCacheKey = ctx.thread.join('@');
            const cached = ctx.cache.get(callStackCacheKey);

            if (cached) {
                return cached.initial;
            } else {
                ctx.cache.set(callStackCacheKey, value)
                return value.initial;
            }
        }
    }
};

