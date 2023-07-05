import { handleGenericGenerator } from './core.mjs';
import { refPlugin } from './ref-plugin.mjs';
import { usePlugin } from './use-plugin.mjs';

export const createFiberRoot = (gen, plugins = []) => {
    const traceHead = {};

    const ctx = {
        trace: traceHead,
        traceHead: traceHead,
        thread: [],
    };

    const lock = { current: null };

    const instantiatedPlugins = [...plugins, refPlugin, usePlugin].map(x => x(ctx));

    // TODO: implement dispose
    return async (...args) => {
        if (lock.current) {
            await lock.current;
        }
        lock.current = handleGenericGenerator(gen(...args), ctx, instantiatedPlugins);
        const result = await lock.current;
        lock.current = null;

        console.log('TRACE DUMP', JSON.stringify(ctx.trace, null, '  '));

        return result;
    };
};

export { ref } from './ref-plugin.mjs';
export { use } from './use-plugin.mjs';
export { r } from './core.mjs';
