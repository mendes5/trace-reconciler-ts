import { r } from "./src/core.mjs";
import { createFiberRoot, memo, ref, use } from "./src/lib.mjs";

const timeOfFirstCall = r(function* (label) {
    return yield memo(function* (arg) {
        console.log('Memo setup', arg);
        
        yield Date.now();
        
        console.log('Memo dispose');
    }, [label]);
});

const gen = r(function * () {
    const count = yield ref(0);
    count.current++;

    const arg = Math.floor(count.current / 6);

    const root = yield timeOfFirstCall(arg);

    console.log(`Value from memo (${count.current}/${arg})`, root);
});

const tick = createFiberRoot(gen)

const main = async () => {
    for (const _ of new Array(20)) 
        await tick();

    await tick.dispose();
}

main();
