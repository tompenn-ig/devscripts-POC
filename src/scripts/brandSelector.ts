import { readdir, symlink, unlink } from 'fs/promises';
import { select } from '@inquirer/prompts';
import { trimStart } from 'lodash';
import colors from 'colors/safe';
import { folderExists, isFrontendRepo } from '../utils';
import { Context } from '../context';
import { logError, logSuccess } from '../log';

interface BrandSelectorProps {
  context: Context;
  brand: string;
  theme: string;
}

const getBrandList = async (directory: string) => {
  return (await readdir(directory, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
};

export const brandSelector = async ({ context, brand, theme }: BrandSelectorProps) => {
  try {
    if (!isFrontendRepo({ repo: context.repo })) return;
    // remove leading '/'
    const brandPath = trimStart(brand, '/');
    const themePath = trimStart(theme, '/');

    // get list of brands
    const brands = await getBrandList(`${context.directory}/${brandPath}`);

    // show selector
    const selectedBrand = await select({
      message: 'Select a Brand:',
      choices: brands.map((b) => ({ name: b, value: b })),
    });

    // remove existing symlink
    const existingSymlink = await folderExists({
      path: `${context.directory}/${themePath}`,
      verbose: context.verbose,
    });
    if (existingSymlink) {
      await unlink(`${context.directory}/${themePath}`);
    }

    // create symlink
    await symlink(`${context.directory}/${brandPath}/${selectedBrand}`, `${context.directory}/${themePath}`);

    logSuccess(colors.bold(`\nThe ${selectedBrand} theme is now being used`));
  } catch (e) {
    if (e instanceof Error) {
      logError(e.message);
      return;
    }
    console.error('Unknown Error', e);
  }
};
