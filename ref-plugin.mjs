import { r } from "./core.mjs";

const Ref = Symbol('Ref');

// Like useRef from react
// Keeps a mutable cell alive between reconciliations 
export const ref = r(function*(current) {
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

export const refPlugin = () => {
    return {
        matches: (value) => value.Ref === Ref,
        exec: (value, key, ctx) => {
            var key = key.join('@');
            if (!ctx.refs) {
                ctx.refs = {};
            }
            const cached = ctx.refs[key];

            if (cached) {
                return cached.initial;
            } else {
                ctx.refs[key] = value;
                return value.initial;
            }
        }
    }
};
