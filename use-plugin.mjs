import { reconcile } from "./core.mjs";

const Use = Symbol('Use');

export const use = reconcile(function* ref(generator) {
    return yield { Use, generator };
});

export const usePlugin = (ctx) => {
    ctx.genCache = new Map();
    return {
        matches: (value) => value.Use === Use,
        exec: ({ generator }, ctx) => {
            const callStackCacheKey = ctx.thread.join('@');
            const cached = ctx.genCache.get(callStackCacheKey);

            if (cached) {
                return cached.next().value;
            } else {
                const newItem = generator();
                newItem.next();
                ctx.genCache.set(callStackCacheKey, newItem);
                return newItem.next().value;
            }
        }
    }
};
