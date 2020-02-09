import {CacheDeserializer} from "../interfaces";
import {isScalar, SCALAR_KEY} from "../util";

const StringDeserializer = (value: string) => {

    // any can break type safety
    if(typeof value !== 'string') {
        return value;
    }

    if(value.startsWith('"') && value.endsWith('"')) {
        return unescape(value.substr(1,value.length-2));
    } else if(value === 'false' || value === 'true') {
        return value === 'true';
    } else if(value === 'null') {
        return null;
    } else {
        try {
            return JSON.parse(value);
        } catch(e) {
            let num = value.indexOf('.') >= 0 ? parseFloat(value) : parseInt(value);
            if(num.toString() === value) {
                return num;
            }
        }
    }

    return value;
};

export const BasicDeserializer: CacheDeserializer = (value: {[key: string]: any} | string) => {

    if(typeof value === 'object') {
        if(isScalar(value)) {
            return StringDeserializer(value[SCALAR_KEY]);
        } else {
            for(const key in value) {
                if(value.hasOwnProperty(key)) {
                    value[key] = StringDeserializer(value[key]);
                }
            }
            return value;
        }
    } else {
        return StringDeserializer(value);
    }
};
