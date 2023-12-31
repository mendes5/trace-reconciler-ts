import { r, createSyncFiberRoot, use } from "./src/lib.mjs";

const count = r(function* (label) {
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
    const root = yield count('root');

    // Its a bit weird seeing the cleanup
    // for B running only after the first
    // time A logs again... 
    //
    // But that's just how mafia works.
    if ((root % 8) < 4) {
        console.log('A::', yield count('A'));
    } else {
        console.log('B::', yield count('B'));
    }
});

const tick = createSyncFiberRoot(gen)

for (const _ of new Array(24))
    tick();

tick.dispose();
