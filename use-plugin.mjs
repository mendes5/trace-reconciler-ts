import { r } from "./core.mjs";

const Use = Symbol('Use');

export const use = r(function*(generator) {
    return yield { Use, generator };
});

export const usePlugin = () => {
    return {
        matches: (value) => value.Use === Use,
        dispose: (ctx) => {
            for (const gen of Object.values(ctx.uses ?? {})) {
                gen.return();
            }
        },
        exec: ({ generator }, key, ctx) => {
            var key = key.join('@');

            if (!ctx.uses) {
                ctx.uses = {};
            }
            const cached = ctx.uses[key];

            if (cached) {
                return cached.next().value;
            } else {
                const newItem = generator();
                const result = newItem.next().value;
                ctx.uses[key] = newItem;
                return result;
            }
        }
    }
};
