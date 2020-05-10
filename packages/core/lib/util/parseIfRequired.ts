export const parseIfRequired = (parsable: string): string => {
  try {
    const parsed = JSON.parse(parsable);

    if (typeof parsed === 'object') {
      return parsed;
    }

    return parsable;
  } catch (err) {
    return parsable;
  }
};
