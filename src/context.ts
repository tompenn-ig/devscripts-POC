import { Options } from './options';
import { readFile } from 'fs/promises';
import { fileExists } from './utils';
import { logVerbose, setIsVerbose } from './log';
import path from 'path';

export interface Repo {
  name: string;
  type: 'frontend' | 'backend';
}

export type Context = {
  //the current path
  directory: string;
  repo: Repo | undefined;
} & Options;

interface PackageFile {
  name: string;
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
}

const isPackageFile = (data: unknown): data is PackageFile => {
  return typeof data === 'object' && !!data && 'name' in data && 'devDependencies' in data && 'dependencies' in data;
};

interface GetPackageFileProps {
  directory: string;
  verbose?: boolean;
}

const getPackageFile = async ({ directory, verbose }: GetPackageFileProps): Promise<PackageFile | null> => {
  const path = `${directory}/package.json`;
  logVerbose(`Looking for package.json file in path: ${path}`);
  if (!(await fileExists({ path, verbose }))) {
    logVerbose(`Could not find package.json`);
    return null;
  }
  logVerbose(`Found package.json`);
  const data = await readFile(path, 'utf8');
  try {
    const json = JSON.parse(data);
    if (isPackageFile(json)) {
      return json;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

interface GetNameProps {
  name: string;
  directory: string;
}

const getName = ({ name, directory }: GetNameProps) => {
  if (name === 'gametemplate-js' || name === '') return path.parse(directory).name;
  return name;
};

interface CreateRepoProps {
  pkgFile: PackageFile;
  directory: string;
}

const createRepo = async ({ pkgFile, directory }: CreateRepoProps): Promise<Repo> => {
  const hasReact = Object.keys(pkgFile.dependencies).includes('react');
  return {
    name: getName({ name: pkgFile.name, directory }),
    type: hasReact ? 'frontend' : 'backend',
  };
};

export const createContext = async (opts: Options): Promise<Context> => {
  setIsVerbose(opts.verbose);
  const directory = process.cwd();
  const pkgFile = await getPackageFile({ directory, verbose: opts.verbose });
  const repo = pkgFile ? await createRepo({ pkgFile, directory }) : undefined;
  if (!repo) logVerbose(`Running without a selected Repo`);
  return { ...opts, directory, repo };
};
