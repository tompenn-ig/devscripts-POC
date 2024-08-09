import { stat } from 'fs/promises';
import { logError, logInfo, logVerbose } from './log';
import { Repo } from './context';

interface ExistsProps {
  path: string;
  verbose?: boolean;
}

const pathExists = async ({ path, verbose }: ExistsProps) => {
  try {
    return await stat(path);
  } catch (e) {
    if (verbose && e instanceof Error) logVerbose(e.message);
    return false;
  }
};

export const fileExists = async ({ path, verbose }: ExistsProps) => {
  const stats = await pathExists({ path, verbose });
  if (!stats) return false;
  return stats.isFile();
};

export const folderExists = async ({ path, verbose }: ExistsProps) => {
  const stats = await pathExists({ path, verbose });
  if (!stats) return false;
  return stats.isDirectory();
};

interface IsFrontendRepoProps {
  repo: Repo | undefined;
}

export const isFrontendRepo = ({ repo }: IsFrontendRepoProps) => {
  // check if this is frontend repo
  if (!repo) {
    logError('Could not find `package.json` file, ensure this is run from the route of a repository');
    return false;
  }

  logInfo(`Using Repository ${repo.name}\n\r`);

  if (repo.type === 'backend') {
    logError('This command can only be run in a frontend repo');
    return false;
  }

  return true;
};
