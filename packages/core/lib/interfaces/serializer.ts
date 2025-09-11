export interface Serializer<TCacheDataType> {
  serialize<T>(keyName: string, data: T): TCacheDataType;
  deserialize<T>(keyName: string, serializedData: TCacheDataType): T;
}
