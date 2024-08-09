#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { withOptions } from './options';
import { createContext } from './context';
import { brandSelector, translationExport, translationSync } from './scripts';

const p = withOptions(yargs(hideBin(process.argv)));
p.command(
  'brand-selector',
  'Select the brand to use for the a frontend',
  (yargs) => {
    return yargs
      .positional('theme-path', {
        describe: 'The path to output the theme to',
        default: '/src/theme',
      })
      .positional('brand-path', {
        describe: 'The path to look for brands',
        default: '/src/brands',
      });
  },
  async (argv) => {
    const context = await createContext(argv);
    await brandSelector({
      context,
      brand: argv.brandPath,
      theme: argv.themePath,
    });
  },
);

p.command(
  'translation-sync',
  'Used to import translations for the current theme in a FE repo',
  (yargs) => {
    return yargs
      .positional('src', {
        describe: 'The file to import translations from',
        default: '/src/theme/locales/Translated.xlsx',
      })
      .positional('locales', {
        describe: 'The folder where translations are stored',
        default: '/src/theme/locales',
      });
  },
  async (argv) => {
    const context = await createContext(argv);
    const { src, locales } = argv;

    await translationSync({ context, src, locales });
  },
);

p.command(
  'translation-export',
  'Used to export translations from a FE repo into a spreadsheet',
  (yargs) => {
    return yargs
      .positional('locales', {
        describe: 'The folder where translations are stored',
        default: '/src/theme/locales',
      })
      .positional('out', {
        describe:
          'The absolute path to output the spreadsheet, by default this will output in the directory the command was run from',
        default: undefined,
        type: 'string',
      });
  },
  async (argv) => {
    const context = await createContext(argv);
    const { out, locales } = argv;
    await translationExport({ context, out, locales });
  },
);

p.strictCommands().demandCommand(1).parse();
