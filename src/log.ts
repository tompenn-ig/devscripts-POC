import colors from 'colors/safe';

let isVerbose = false;

export const setIsVerbose = (value: boolean | undefined) => {
  isVerbose = !!value;
};

export const logError = (msg: string, ...any: unknown[]) => {
  console.log(colors.red(colors.bold('Error -')), colors.red(msg), ...any);
};

export const logInfo = (msg: string, ...any: unknown[]) => {
  console.log(colors.yellow(msg), ...any);
};

export const logVerbose = (msg: string, ...any: unknown[]) => {
  if (!isVerbose) return;
  console.log(colors.gray(colors.italic(msg)), ...any);
};

export const logSuccess = (msg: string, ...any: unknown[]) => {
  console.log(colors.green(msg), ...any);
};
