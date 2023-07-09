import { r } from "../core.mjs";
import { isSameDependencies } from "../utils.mjs";

const Memo = Symbol('Memo');

export const memo = r(function* (generator, args) {
    return yield { Memo, generator, args };
});

export const memoPlugin = () => {
    return {
        matches: (value) => value.Memo === Memo,
        dispose: (ctx) => {
            for (const gen of Object.values(ctx.memos ?? {})) {
                // stepping once trough all generators
                // on this frame should be enough to clear tem
                gen.next();
            }
        },
        exec: ({ generator, args }, key, ctx) => {
            var key = key.join('@');

            if (!ctx.memos) {
                ctx.memos = {};
            }

            const cached = ctx.memos[key];

            if (cached) {
                if (isSameDependencies(cached.args, args)) {
                    // Deps are the same, just return the memoized
                    // value 
                    return cached.value;
                } else {
                    // Else, dispose old memo
                    // By stepping its generator you are 
                    // running its cleanup function too
                    // since those generators are written 
                    // like the following
                    // `yield memo(function*() {
                    //
                    //    const resource = new Resource(); // create resource
                    //
                    //    yield resource; // yield and hold it alive for as long as the caller needs
                    //
                    //    resource.dispose(); // cleanup 
                    // }, []);`
                    cached.next(); // we do not care about the return of cleanup functions
                }
            }

            // If not cached just instantiate
            // and return first value
            const newItem = generator(...args);
            const result = newItem.next().value;
            newItem.value = result;
            newItem.args = args;
            ctx.memos[key] = newItem;
            return result;

        }
    }
};
