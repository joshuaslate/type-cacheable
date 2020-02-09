export const serializeValue = (val: any): string => {
    if (typeof val === 'string') {
        return '"' + escape(val) + '"';
    } else if (typeof val === 'object') {
        return JSON.stringify(val);
    } else {
        return val.toString();
    }
}
