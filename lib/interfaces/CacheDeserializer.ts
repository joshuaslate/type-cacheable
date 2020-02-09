export interface CacheDeserializer {
    (val: {[key: string]: any} | string): any;

}
