import * as fs from 'fs-extra';
import * as path from 'path';

const fontsPath = path.join(__dirname, '');

export interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

// Helper function to read font files as base64
function readFontFile(fontName: string): string {
  const fontPath = path.join(fontsPath, fontName);
  if (fs.existsSync(fontPath)) {
    return fs.readFileSync(fontPath, 'base64');
  }
  throw new Error(`Font file not found: ${fontPath}`);
}

// export const fonts: Record<string, FontConfig> = {
//   Sarabun: {
//     normal: readFontFile('Sarabun/Sarabun-Regular.ttf'),
//     bold: readFontFile('Sarabun/Sarabun-Medium.ttf'),
//     italics: readFontFile('Sarabun/Sarabun-Italic.ttf'),
//     bolditalics: readFontFile('Sarabun/Sarabun-MediumItalic.ttf'),
//   },
// };

export const defaultFont = 'Sarabun';

// pdfmake expects fonts in a different format
type TFont = {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
};

export const pdfmakeFonts: Record<string, TFont> = {
  Sarabun: {
    normal: path.join(__dirname, '../../src/fonts/Sarabun/Sarabun-Regular.ttf'),
    bold: path.join(__dirname, '../../src/fonts/Sarabun/Sarabun-Medium.ttf'),
    italics: path.join(__dirname, '../../src/fonts/Sarabun/Sarabun-Italic.ttf'),
    bolditalics: path.join(__dirname, '../../src/fonts/Sarabun/Sarabun-MediumItalic.ttf'),
  },
};
