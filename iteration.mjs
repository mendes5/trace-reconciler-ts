import { r } from "./core.mjs";
import { createFiberRoot, key, use } from "./lib.mjs";

const range = n => [...new Array(n)].map((_, i) => i);

const count = r(function* (label, initial) {
    return yield use(function* () {
        console.log(`Setup ${label}`);
        
        let i = initial;

        try {
            while (true) {
                yield i;
                i += 1;
            }
        } finally {
            console.log(`Cleanup ${label}`);
        }
    });
});

// This should create nine generators
// Even tough we only have 3
// For each I in the loop we will get
// new instances for each count
//
// Kinda like a virtual stack frame.
// Or a dedicated stack frame for
// each loop iteration.
const gen = r(function * () {
    for (const i of range(3)) {
        const unKey = yield key(i);

        const a = yield count(`First ${i}`, 10);
        const b = yield count(`Second ${i}`, 20);
        const c = yield count(`Third ${i}`, 30);

        console.log([a, b, c]);

        unKey();
    }
});

const tick = createFiberRoot(gen)

const main = async () => {
    for (const _ of new Array(3)) 
        await tick();

    await tick.dispose();
}

main();
