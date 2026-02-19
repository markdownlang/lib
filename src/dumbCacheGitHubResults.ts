import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DateTime } from 'luxon';
import fetchAllMdlibsFromGitHub from "./fetchAllMdlibsFromGitHub.ts";
import pino from "pino";

const logger = pino();

export default async function dumbCacheGitHubResults (timeout: number, dir: string, cacheFile: string) {
	if(timeout > 1000*60*120) new Error("Timeout too long! Please set a timeout of 120 minutes or less in milliseconds.");
	if(timeout < 1000*10) new Error("Timeout too short! Please set a timeout of 10 seconds or more in milliseconds.");
	
	try {
		const now = DateTime.now().toUTC();
		const dirContents = await readdir(dir);
		logger.info(`dir contents: ${dirContents}`);

		if (dirContents.length > 0) {
			const latestFile = dirContents.sort().reverse()[0];
			logger.info(`latest file: ${latestFile}`);
			// @ts-expect-error
			const fileContent = await readFile(join(dir, latestFile), 'utf-8');
			const { timestamp, data } = JSON.parse(fileContent);
			const fileTime = DateTime.fromISO(timestamp);
			logger.info(`fileTime: ${fileTime}`);
			const diff = now.diff(fileTime).as("milliseconds");
			logger.info(`now: ${now}`)
			logger.info(`fileTime: ${fileTime}`);
			logger.info(`now diff with filetime: ${diff}`)
			
			if (diff < timeout) {
				logger.info("using cached data");
				return data;
			} else {
				logger.info("cache expired, fetching new data");
				const data = await fetchAllMdlibsFromGitHub();
				logger.info("attempting to write new data to cache");

				const writtenFile = await writeFile(cacheFile, JSON.stringify({ timestamp: now.toISO(), data }, null, 2));
				if (writtenFile === undefined) {
					logger.info(`data written: ${cacheFile}`);
				} else {
					logger.error(`Error writing new data to cache: ${cacheFile}: ${writtenFile}`);
				}
				return data;
			}
		} else {
			logger.info('No cache file found, fetching data from GitHub');
			const data = await fetchAllMdlibsFromGitHub();
			logger.info("attempting to write new data to cache");

			const writtenFile = await writeFile(cacheFile, JSON.stringify({ timestamp: now.toISO(), data }, null, 2));
			if (writtenFile === undefined) {
				logger.info(`data written: ${cacheFile}`);
			} else {
				logger.error(`Error writing new data to cache: ${cacheFile}: ${writtenFile}`);
			}
			return data;
		}
	} catch (err) {
		throw new Error(`Error in dumbCacheGitHubResults: ${err}`);
	}
}