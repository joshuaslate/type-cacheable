export const setMetadata = (descriptor: PropertyDescriptor, originalMethod: Function | undefined) => {
  if (!originalMethod) return;
  Object.defineProperty(descriptor.value, 'name', {value: originalMethod.name, writable: false});

  Reflect
    .getMetadataKeys(originalMethod)
    .forEach(key => {
      const meta = Reflect.getMetadata(key, originalMethod);
      Reflect.defineMetadata(key, meta, descriptor.value);
    })
}
