import { createFiber, disposeRecursive, enterScopeSync, enterScopeAsync, type Plugin } from './core';
import { keyPlugin } from './plugins/key-plugin';
import { memoPlugin } from './plugins/memo-plugin';
import { refPlugin } from './plugins/ref-plugin';
import { usePlugin } from './plugins/use-plugin';
import { createLock } from './utils';

export const createAsyncFiberRoot = <T extends unknown[], R>(gen: (...args: T) => Generator<any, R>, plugins: Plugin[] = []) => {
  const ctx = createFiber();
  const lock = createLock<R>();

  const instantiatedPlugins = [
    ...plugins,
    refPlugin,
    usePlugin,
    keyPlugin,
    memoPlugin
  ].map(plugin => plugin(ctx));

  const tick = (...args: T) => lock(async () =>
    enterScopeAsync(gen(...args), ctx, instantiatedPlugins) as Promise<R>
  );

  tick.dispose = () => {
    return lock(async () =>
      disposeRecursive(ctx.traceHead, instantiatedPlugins) as unknown as R,
    ).then(() => undefined);
  }

  return tick;
};

export const createSyncFiberRoot = <T extends unknown[], R>(gen: (...args: T) => Generator<any, R>, plugins: Plugin[] = []) => {
  const ctx = createFiber();

  const instantiatedPlugins = [
    ...plugins,
    refPlugin,
    usePlugin,
    keyPlugin,
    memoPlugin
  ].map(plugin => plugin(ctx));

  const tick = (...args: T): R => {
    return enterScopeSync(gen(...args), ctx, instantiatedPlugins) as R;
  };

  tick.dispose = () => disposeRecursive(ctx.traceHead, instantiatedPlugins);

  return tick;
};

export { ref } from './plugins/ref-plugin';
export { key } from './plugins/key-plugin';
export { use } from './plugins/use-plugin';
export { memo } from './plugins/memo-plugin';
export { r } from './core';
