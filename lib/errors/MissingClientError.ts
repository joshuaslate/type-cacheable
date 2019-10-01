export class MissingClientError extends Error {
  constructor(propertyKey: string) {
    super(`type-cacheable: missing cache client. Please add one or remove the @Cacheable or @CacheClear decorator from ${propertyKey}, as it is not being used.`);
  }
}
