import { Context } from '../../context';
import { isFrontendRepo } from '../../utils';

interface TranslationSyncProps {
  context: Context;
  src: string;
  locales: string;
}

export const translationSync = async ({ context, src, locales }: TranslationSyncProps) => {
  if (!isFrontendRepo({ repo: context.repo })) return;

  //todo load spreadsheet using

  //todo parse spreadsheet into [en-GB][key] = value , [es][key] = value

  //todo iterate over the object writing json files

  //todo format json files to ensure changes are easy to see
};
