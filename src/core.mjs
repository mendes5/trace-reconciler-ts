const getStackFrame = (depth) =>
    `${new Error().stack.split('\n')[depth].trim().split('/').slice(-1)[0]}`;

export const r = fn => (...args) => {
    // 0 Error Object
    // 1 GetStackFrame
    // 2 This Function
    // 3 Parent Function
    const recordedPosition = getStackFrame(3);

    function* hackGenerator() {
        const gen = fn(...args);

        gen.recordedPosition = recordedPosition;

        return gen;
    }

    return hackGenerator();
};

const isGenerator = generator => generator && (generator.toString() === '[object Generator]' || generator.toString() === '[object AsyncGenerator]');

const createFrameContext = () => ({
    child: {},
    unusedLanes: new Set(),
    tapCount: 0,
});

export const createContext = () => {
    const frameContext = createFrameContext();

    const ctx = {
        disposed: false,
        trace: frameContext,
        traceHead: frameContext,
        thread: [],
    };

    return ctx;
};

export const disposeRecursive = (context, plugins) => {
    context.disposed = true;

    for (const plugin of plugins) {
        plugin.dispose?.(context);
    }

    for (const node of Object.values(context.child ?? {})) {
        disposeRecursive(node, plugins);
    }
};


export const enterScopeAsync = async (generator, ctx, plugins) => {
    if (!isGenerator(generator))
        throw new Error(`Non generator passed to enterScope`);

    if (ctx.disposed)
        throw new Error(`Tried to call enterScope on a disposed context frame`);

    let parentFrameContext;
    let frameContext;

    if (generator.recordedPosition) {
        parentFrameContext = ctx.traceHead;

        ctx.thread.push(generator.recordedPosition);

        if (!ctx.traceHead.child[generator.recordedPosition]) {
            frameContext = createFrameContext();
            ctx.traceHead.child[generator.recordedPosition] = frameContext;
            ctx.traceHead = frameContext;
        } else {
            frameContext = ctx.traceHead.child[generator.recordedPosition];
            frameContext.unusedLanes = new Set(Object.keys(frameContext.child));
            frameContext.tapCount++;
            ctx.traceHead = frameContext;
        }

        parentFrameContext.unusedLanes.delete(generator.recordedPosition);
    }

    const handlePlugins = (value, key) => {
        if (value) for (const plugin of plugins) {
            if (plugin.matches(value)) {
                return plugin.exec(value, key, frameContext);
            }
        }
        return value;
    }

    try {
        let last;
        do {
            last = await generator.next(last?.value);

            if (isGenerator(last?.value)) {
                last.value = await enterScopeAsync(last.value, ctx, plugins);
            } else {
                last.value = handlePlugins(last.value, ctx.thread);
            }
        } while (last.done === false);

        return last.value;
    } finally {
        if (generator.recordedPosition) {
            ctx.traceHead = parentFrameContext;
            ctx.thread.pop();

            for (const lane of frameContext.unusedLanes) {
                disposeRecursive(frameContext.child[lane], plugins);
                delete frameContext.child[lane];
            }
        }
    }
};

export const enterScopeSync = (generator, ctx, plugins) => {
    if (!isGenerator(generator))
        throw new Error(`Non generator passed to enterScope`);

    if (ctx.disposed)
        throw new Error(`Tried to call enterScope on a disposed context frame`);

    let parentFrameContext;
    let frameContext;

    if (generator.recordedPosition) {
        parentFrameContext = ctx.traceHead;

        ctx.thread.push(generator.recordedPosition);

        if (!ctx.traceHead.child[generator.recordedPosition]) {
            frameContext = createFrameContext();
            ctx.traceHead.child[generator.recordedPosition] = frameContext;
            ctx.traceHead = frameContext;
        } else {
            frameContext = ctx.traceHead.child[generator.recordedPosition];
            frameContext.unusedLanes = new Set(Object.keys(frameContext.child));
            frameContext.tapCount++;
            ctx.traceHead = frameContext;
        }

        parentFrameContext.unusedLanes.delete(generator.recordedPosition);
    }

    const handlePlugins = (value, key) => {
        if (value) for (const plugin of plugins) {
            if (plugin.matches(value)) {
                return plugin.exec(value, key, frameContext);
            }
        }
        return value;
    }

    try {
        let last;
        do {
            last = generator.next(last?.value);

            if (isGenerator(last?.value)) {
                last.value = enterScopeSync(last.value, ctx, plugins);
            } else {
                last.value = handlePlugins(last.value, ctx.thread);
            }
        } while (last.done === false);

        return last.value;
    } finally {
        if (generator.recordedPosition) {
            ctx.traceHead = parentFrameContext;
            ctx.thread.pop();

            for (const lane of frameContext.unusedLanes) {
                disposeRecursive(frameContext.child[lane], plugins);
                delete frameContext.child[lane];
            }
        }
    }
};
