import { createContext, enterScope } from './core.mjs';
import { refPlugin } from './ref-plugin.mjs';
import { usePlugin } from './use-plugin.mjs';
import { createLock } from './utils.mjs';

export const createFiberRoot = (gen, plugins = []) => {

    const ctx = createContext();
    const lock = createLock();

    const instantiatedPlugins = [...plugins, refPlugin, usePlugin].map(x => x(ctx));

    return async (...args) => {
        const result = await lock(() =>
            enterScope(gen(...args), ctx, instantiatedPlugins)
        );

        console.log('TRACE DUMP', JSON.stringify(ctx.trace, null, '  '));

        return result;
    };
};

export { ref } from './ref-plugin.mjs';
export { use } from './use-plugin.mjs';
export { r } from './core.mjs';
