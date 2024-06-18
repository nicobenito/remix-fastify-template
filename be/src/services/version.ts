import semverParse from 'semver/functions/parse';

import { version as pkgVersion } from '../../package.json';

export const version = semverParse(pkgVersion)!;
