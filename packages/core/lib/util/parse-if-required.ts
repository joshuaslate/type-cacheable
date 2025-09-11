const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}Z$/;

const fixDates = (_: string, value: any) => {
  if (typeof value === 'string' && dateFormat.test(value)) {
    return new Date(value);
  }
  return value;
};

export const parseIfRequired = (parsable: string): string => {
  try {
    return JSON.parse(parsable, fixDates);
  } catch (err) {
    return parsable;
  }
};
