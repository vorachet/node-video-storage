import * as os from 'os';

export function getTempFolderPath() {
  return os.homedir() + '/.downloadTemp';
}
