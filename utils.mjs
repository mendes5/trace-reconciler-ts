export const createLock = () => {
    const lock = { current: null };

    return async (promise) => {
        if (lock.current) {
            return await lock.current;
        }

        lock.current = promise();
        const result = await lock.current;
        lock.current = null;
        return result;
    }
}
