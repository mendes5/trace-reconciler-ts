const Key = Symbol('Key');

export const key = function*(key) {
    return yield { Key, key };
};

export const keyPlugin = () => {
    return {
        matches: (value) => value.Key === Key,
        exec: (param, key) => {
            if (param.Key === Key) {
                key.push(param.key);
            }

            return () => key.pop();
        }
    }
};
