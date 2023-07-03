const getStackFrame = (depth) =>
    `${new Error().stack.split('\n')[depth].trim().split('/').slice(-1)[0]}`;

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

        return gen;
    }

    return hackGenerator();
};

const isGenerator = generator => generator && (generator.toString() === '[object Generator]' || generator.toString() === '[object AsyncGenerator]');

// TODO: create async and sync versions
export const handleGenericGenerator = async (generator, ctx, plugins) => {
    if (generator.recordedPosition) {
        ctx.thread.push(generator.recordedPosition);
    }

    const handlePlugins = (value, ctx) => {
        if (value) for (const plugin of plugins) {
            if (plugin.matches(value)) {
                return plugin.exec(value, ctx);
            }
        }
        return value;
    }

    try {
        if (isGenerator(generator)) {
            let last;
            do {
                last = await generator.next(last?.value);

                if (isGenerator(last?.value)) {
                    last.value = await handleGenericGenerator(last.value, ctx, plugins);
                } else {
                    last.value = handlePlugins(last.value, ctx);
                }
            } while (last.done === false);
            return last.value;
        } else {
            throw new Error(`Non generator passed to handleGenericGenerator`);
        }
    } finally {
        if (generator.recordedPosition) {
            ctx.thread.pop();
        }
    }
};