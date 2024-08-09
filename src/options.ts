import yargs, { Argv } from 'yargs';

export const withOptions = (p: yargs.Argv) => {
  return p.options('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  });
};

export type Options = ReturnType<typeof withOptions> extends Argv<infer T> ? T : never;
