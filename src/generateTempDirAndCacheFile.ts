import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { DateTime } from 'luxon';
import pino from 'pino';

const logger = pino();

export default async function generateTempDirAndCacheFile() {
		const now = DateTime.now().toUTC();

		const dir = await mkdtemp(join(tmpdir(), 'lib-markdownlang-'));
		const cacheFile = join(dir, `${now.toISO()}.json`);
		logger.info(`cache dir: ${dir}`);
		logger.info(`cache file: ${cacheFile}`);

		return { dir, cacheFile };
}