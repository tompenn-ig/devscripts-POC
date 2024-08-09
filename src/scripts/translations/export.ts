import { copyFile, readdir, readFile } from 'fs/promises';
import { Context } from '../../context';
import { isFrontendRepo } from '../../utils';
import { logError, logSuccess } from '../../log';
import { getSheet, parseSheet, writeLanguagesToExcel } from './excel';

interface GetLocalesProps {
  path: string;
}

const getLocales = async ({ path }: GetLocalesProps) => {
  return (await readdir(path, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
};

interface LoadTranslationsProps {
  path: string;
  names: string[];
}

type Translations = Record<string, Record<string, string>>;

export const loadTranslations = async ({ path, names }: LoadTranslationsProps): Promise<Translations> => {
  const translations: Translations = {};
  for (const name of names) {
    try {
      const file = await readFile(`${path}/${name}/translation.json`, 'utf8');
      translations[name] = JSON.parse(file) as Record<string, string>;
    } catch (e) {
      if (!(e instanceof Error)) throw e;
      logError(e.message);
    }
  }

  return translations;
};

interface TranslationExportProps {
  context: Context;
  locales: string;
  out: string | undefined;
}

export const translationExport = async ({ locales, out, context }: TranslationExportProps) => {
  try {
    if (!isFrontendRepo({ repo: context.repo })) return;
    // load all json files in locales
    const localeNames = await getLocales({ path: `${context.directory}/${locales}` });

    // create a map of [en-GB][key] = value
    const translationMap = await loadTranslations({ path: `${context.directory}/${locales}`, names: localeNames });

    // copy TranslationsTemplate to output
    const templatePath = `${require.main?.path}/../docs/TranslationsTemplate.xlsx`;
    const outPath = `${out ?? context.directory}/Translations.xlsx`;
    await copyFile(templatePath, outPath);

    // open TranslationTemplate
    const excelSheet = getSheet({ path: outPath });
    const languages = parseSheet({ sheet: excelSheet });

    // add translations from json files to the language object
    for (const language of languages) {
      const { code } = language;
      language.translation = translationMap[code];
    }

    // write the language object to the sheet
    await writeLanguagesToExcel({ path: outPath, languages });

    logSuccess(`Exported Translations to: ${outPath}`);
  } catch (e) {
    if (!(e instanceof Error)) throw e;
    logError(e.message);
  }
};
