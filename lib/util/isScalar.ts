// In order to support scalars in hmsets (likely not the intended use, but support has been requested),
// we need at least one key. We can use an empty string.
export const SCALAR_KEY = '';

export const isScalar = (objectValue: any): boolean => {
    if (objectValue && typeof objectValue === 'object' &&
        Object.keys(objectValue).length === 1 && objectValue[SCALAR_KEY]) {
        return true;
    } else {
        return false;
    }
};
