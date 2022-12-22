import { v4 as uuidv4 } from 'uuid';

export function generateStandardFilename() {
  return uuidv4();
}

export function cleanUpText(text: string) {
  return text
    .replace(/\s/g, '')
    .replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '');
}

export function ensureFileExtension(fileid: string, extension = 'webm') {
  const chucks = fileid.split('.');
  if (chucks.length !== 2) {
    return fileid;
  }
  return chucks[0] + '.' + extension;
}
