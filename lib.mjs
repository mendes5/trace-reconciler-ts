import { handleGenericGenerator } from './core.mjs';
import { refPlugin } from './ref-plugin.mjs';

export const createFiberRoot = (gen, plugins = []) => {
    const ctx = {
        thread: [],
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
        lock.current = handleGenericGenerator(gen(...args), ctx, [...plugins, refPlugin]);
        const result = await lock.current;
        lock.current = null;
        return result;
    };
};

export { ref } from './ref-plugin.mjs';
export { reconcile } from './core.mjs';
