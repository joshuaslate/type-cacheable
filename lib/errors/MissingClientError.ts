export class MissingClientError extends Error {
  constructor(propertyKey: string) {
    super(`Missing cache client for ${propertyKey}`);
  }
}
