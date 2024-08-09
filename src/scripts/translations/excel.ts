import { writeFile } from 'fs/promises';
import excelParser from 'node-xlsx';
import { countryCodeMap } from './legacyConstants';
import { logVerbose } from '../../log';

interface Sheet {
  name: string;
  headings: string[][];
  body: string[][];
}

const sheetName = 'Translations';

interface OpenExcelProps {
  path: string;
}

const openExcel = (path: string) => {
  const document = excelParser.parse<string[]>(path);
  const sheet = document.find((d) => d.name === sheetName);
  if (!sheet) throw new Error(`Could not find sheet ${sheetName}`);
  return sheet;
};

export const getSheet = ({ path }: OpenExcelProps): Sheet => {
  const sheet = openExcel(path);
  const headings = sheet.data.slice(0, 2);
  const body = sheet.data.slice(2);
  return {
    headings,
    body,
    name: sheet.name,
  };
};

interface Language {
  code: string;
  name: string;
  translation: Record<string, string>;
}

interface GetCodeForLegacy {
  name: string;
}

/**
 * this is to support the old sheets which did not have the country code in them
 * @param name
 */
const getCodeForLegacy = ({ name }: GetCodeForLegacy) => {
  if (name in countryCodeMap) {
    return countryCodeMap[name as keyof typeof countryCodeMap];
  }
  throw new Error(`Could not find ${name} in countryCodeMap`);
};

interface ParseSheetProps {
  sheet: Sheet;
}

export const parseSheet = ({ sheet }: ParseSheetProps): Language[] => {
  // slice 2 since the codes and names don't start until the 3rd column in
  const codes = sheet.headings[0].slice(2).filter((c) => c.length > 0);
  const names = sheet.headings[1].slice(2).filter((c) => c.length > 0);

  const languages: Language[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (names.length > codes.length) {
      //this is a legacy sheet
      languages.push({ name, code: getCodeForLegacy({ name }), translation: {} });
      continue;
    }
    //this is for the new sheets with codes in them
    if (!codes[i]) throw new Error(`Could not find code for ${name} in the sheet`);
    languages.push({ name, code: codes[i], translation: {} });
  }

  //first column is keys
  const keys = sheet.body.slice(0, 1)[0];

  //translations, same as names and codes starts 3rd column in
  const data = sheet.body.slice(2);

  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; row++) {
      languages[col].translation[keys[col]] = data[col][row];
    }
  }
  return languages;
};

interface WriteLanguagesToExcelProps {
  path: string;
  languages: Language[];
}

export const writeLanguagesToExcel = async ({ path, languages }: WriteLanguagesToExcelProps) => {
  const sheet = openExcel(path);

  const translationKey = Object.keys(languages[0].translation);

  const filtered = languages.filter((l) => {
    if (!l.translation) {
      logVerbose(`Could not find translations for '${l.name} (${l.code})'`);
    }
    return !!l.translation;
  });

  for (let row = 0; row < translationKey.length; row++) {
    const translationKeyItem = translationKey[row];
    //headers take up two rows
    const rowWithHeaders = row + 2;
    if (!sheet.data[rowWithHeaders]) sheet.data[rowWithHeaders] = [];
    sheet.data[rowWithHeaders][0] = translationKeyItem;

    for (let col = 0; col < filtered.length; col++) {
      const language = filtered[col];

      if (!(translationKeyItem in language.translation)) {
        logVerbose(`Could not find value for key '${translationKeyItem}' for '${language.name} (${language.code})'`);
        continue;
      }
      // translations start two columns in
      sheet.data[rowWithHeaders][col + 2] = language.translation[translationKeyItem];
    }
  }

  const buffer = excelParser.build([{ ...sheet, options: {} }]);
  await writeFile(path, buffer);
};
