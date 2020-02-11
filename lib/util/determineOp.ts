import {NoOpDeterminer} from '../interfaces';

export const determineOp = (noopArg: boolean | NoOpDeterminer, args: any[], context: any): boolean => {
  return noopArg instanceof Function
    ? noopArg(args, context)
    : noopArg;
};
