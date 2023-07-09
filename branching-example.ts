import { r, createSyncFiberRoot, use } from "./src";

const count = r(function* (label: string) {
    return yield use(function* () {
        console.log(`Setup ${label}`);

        let i = 0;

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
    // eslint-disable-next-line
    const root: number = yield count('root');

    if ((root % 8) < 4) {
        console.log('A::', yield count('A'));
    } else {
        console.log('B::', yield count('B'));
    }
});

export default function branchingExample() {
    const tick = createSyncFiberRoot(gen)

    for (const _ of new Array(24))
        tick();
    
    tick.dispose();
}


