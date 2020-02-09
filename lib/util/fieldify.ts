import {serializeValue} from "./serializeValue";
import {SCALAR_KEY} from "./isScalar";

export const fieldify = (value: any): string[] => {

  if (typeof value === 'object' && !(value instanceof Array)) {
    let fields = Object.entries(value).map(([key, value]) => [key, serializeValue(value)]);
    return ([] as string[]).concat(...fields);
  } else {
    return [SCALAR_KEY, serializeValue(value)];
  }
};
