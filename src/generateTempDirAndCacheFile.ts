import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { DateTime } from 'luxon';

export default async function generateTempDirAndCacheFile() {
		const now = DateTime.now().toUTC();

		const dir = await mkdtemp(join(tmpdir(), 'lib-markdownlang-'));
		const cacheFile = join(dir, `${now.toISO()}.json`);
		console.log('cache dir:', dir);
		console.log('cache file:', cacheFile, '\n');

		return { dir, cacheFile };
}