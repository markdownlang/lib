import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DateTime } from 'luxon';
import fetchAllMdlibsFromGitHub from "./fetchAllMdlibsFromGitHub.ts";

export default async function dumbCacheGitHubResults (timeout: number, dir: string, cacheFile: string) {
	if(timeout > 1000*60*120) new Error("Timeout too long! Please set a timeout of 120 minutes or less in milliseconds.");
	if(timeout < 1000*10) new Error("Timeout too short! Please set a timeout of 10 seconds or more in milliseconds.");
	
	try {
		const now = DateTime.now().toUTC();
		const dirContents = await readdir(dir);
		console.log('dir contents:', dirContents);

		if (dirContents.length > 0) {
			const latestFile = dirContents.sort().reverse()[0];
			console.log('latest file:', latestFile);
			// @ts-expect-error
			const fileContent = await readFile(join(dir, latestFile), 'utf-8');
			const { timestamp, data } = JSON.parse(fileContent);
			const fileTime = DateTime.fromISO(timestamp);
			console.log('fileTime:', fileTime);
			const diff = now.diff(fileTime).as("milliseconds");
			console.log(`now diff with filetime`, diff, now, fileTime);
			
			if (diff < timeout) {
				console.log("Using cached data");
				return data;
			} else {
				console.log("Cache expired, fetching new data");
				const data = await fetchAllMdlibsFromGitHub();
				console.log("Attempting to write new data to cache");

				const writtenFile = await writeFile(cacheFile, JSON.stringify({ timestamp: now.toISO(), data }, null, 2));
				if (writtenFile === undefined) {
					console.log("data written:", cacheFile);
				} else {
					console.log("Error writing new data to cache:", cacheFile, writtenFile);
				}
				return data;
			}
		} else {
			console.log('No cache file found, fetching data from GitHub');
			const data = await fetchAllMdlibsFromGitHub();
			console.log("Attempting to write new data to cache");

			const writtenFile = await writeFile(cacheFile, JSON.stringify({ timestamp: now.toISO(), data }, null, 2));
			if (writtenFile === undefined) {
				console.log("data written:", cacheFile);
			} else {
				console.log("Error writing new data to cache:", cacheFile, writtenFile);
			}
			return data;
		}
	} catch (err) {
		throw new Error(`Error in dumbCacheGitHubResults: ${err}`);
	}
}