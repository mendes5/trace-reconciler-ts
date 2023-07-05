import { createContext, disposeRecursive, enterScope } from './core.mjs';
import { keyPlugin } from './key-plugin.mjs';
import { refPlugin } from './ref-plugin.mjs';
import { usePlugin } from './use-plugin.mjs';
import { createLock } from './utils.mjs';

export const createFiberRoot = (gen, plugins = [], options = {}) => {

    const ctx = createContext();
    const lock = createLock();

    const instantiatedPlugins = [...plugins, refPlugin, usePlugin, keyPlugin].map(x => x(ctx));

    const tick = async function (...args)  {
        const result = await lock(() =>
            enterScope(gen(...args), ctx, instantiatedPlugins)
        );

        if (options.dumpTrace) {
            console.log('TRACE DUMP', JSON.stringify(ctx.trace, null, '  '));
        }

        return result;
    };

    // Dispose is async because it might still
    // be running enqueued calls
    tick.dispose = async () => {
        await lock(() =>
            disposeRecursive(ctx.traceHead, instantiatedPlugins)
        );
    };

    return tick;
};

export { ref } from './ref-plugin.mjs';
export { key } from './key-plugin.mjs';
export { use } from './use-plugin.mjs';
export { r } from './core.mjs';
