import { r, createSyncFiberRoot, memo, ref } from "./src";
import type { RefObject } from "./src/plugins/ref-plugin";

const timeOfFirstCall = r(function* (label: string) {
    return yield memo(function* (arg) {
        console.log('Memo setup', arg);

        yield Date.now();

        console.log('Memo dispose');
    }, [label]);
});

const gen = r(function* () {
    const count: RefObject<number> = yield ref(0);

    const arg = Math.floor(count.current / 6);
    count.current++;

    const root: number = yield timeOfFirstCall(String(arg));

    console.log(`Value from memo (${count.current}/${arg})`, root);
});

export default function memoExample()  {

    const tick = createSyncFiberRoot(gen)
    
    
    for (const a of new Array(20))
        tick();
    
    tick.dispose();
}