export const parseIfRequired = (parsable: string): string => {
  try {
    return JSON.parse(parsable);
  } catch (err) {
    return parsable;
  }
};
