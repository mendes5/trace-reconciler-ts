import { createSyncFiberRoot, key, use, r } from "./src";
import { type KeyMarker } from "./src/plugins/key-plugin";

const range = (n: number) => [...new Array<number>(n).fill(0)].map((_, i) => i);

const count = r(function* (label: string, initial: number) {
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

const gen = r(function* () {
    for (const i of range(3)) {
        const unKey: KeyMarker = yield key(i);

        const a: number = yield count(`First ${i}`, 10);
        const b: number = yield count(`Second ${i}`, 20);
        const c: number = yield count(`Third ${i}`, 30);

        console.log([a, b, c]);

        unKey();
    }
});

export default function iterationExample() {
    const tick = createSyncFiberRoot(gen)

    for (const _ of new Array(3))
        tick();

    tick.dispose();
}

