export const getStackFrame = (depth) =>
    `${new Error().stack.split('\n')[depth].trim().split('/').slice(-1)[0]}`;

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

export const isSameDependencies = (
    prev,
    next
  ) => {
    let valid = true;
    if (next === undefined && prev === undefined) return true;
    if (prev === undefined) valid = false;
    if (next != null && prev != null) {
      if (next === prev) return true;
  
      const n = prev.length || 0;
      if (n !== next.length || 0) valid = false;
      else
        for (let i = 0; i < n; ++i)
          if (prev[i] !== next[i]) {
            valid = false;
            break;
          }
    }
    return valid;
  };
  