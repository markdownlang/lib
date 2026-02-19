import fastify from "fastify";
import fastifyView from "@fastify/view";
import { Edge } from "edge.js";
import { join } from "node:path";
import dumbCacheGitHubResults from "./dumbCacheGitHubResults.ts";
import generateTempDirAndCacheFile from "./generateTempDirAndCacheFile.ts";
import getLibByOwnerAndName from "./getLibByOwnerAndName.ts";

const service = {
	"name": "lib.lang.md",
	"description": "The Markdownlang Public Library",
}
const server = fastify({ logger: true });

// we're using Edge because it's pretty no-nonsense
// you can find more details at https://edgejs.dev
const edge = new Edge();
edge.mount(join(import.meta.dirname, "templates"));

server.register(fastifyView, {
	engine: {
		// @ts-expect-error
		edge: edge,
	},
});

// let's set up everything we're going to need to run the app
const { dir, cacheFile } = await generateTempDirAndCacheFile()
const timeout = Number(process.env['CACHE_TIMEOUT']) || 1000*60*10; // default to 10 minute timeout for cache
const site = {
	root: process.env['SITE_ROOT'] || '127.0.0.1:8080',
	protocol: process.env['SITE_PROTOCOL'] || 'http',
}

// our index renderer. if you want to make changes to the view, you'll likely need to edit
// edge templates in /templates, /components, and /partials.
server.get("/", async (request, reply) => {
	request.log.info("Received request for /");
	const data = {
		site: site,
		metadata: {
			title: service.name,
			description: service.description,
		},
		libs: await dumbCacheGitHubResults(timeout, dir, cacheFile),
	};
	reply.view("../../edge/templates/index.edge", data);
	return reply;
});

// single package view
server.get("/view/:owner/:name", async (request, reply) => {
	const { owner, name } = request.params as { owner: string; name: string };
	request.log.info(`Received request for /view/${owner}/${name}`);

	const libs = await dumbCacheGitHubResults(timeout, dir, cacheFile);
	const fetchedLib = await getLibByOwnerAndName(owner, name, libs);
	const data = {
		site: site,
		metadata: {
			title: `${service.name} - Library: ${owner}/${name}`,
			description: service.description,
		},
		lib: fetchedLib,
	};

	if (!owner || !name) return reply.status(404).send(`${owner}/${name} not found`);
	reply.view("../../edge/templates/view.edge", data);
	return reply;
});


// this is the function that serves libraries to the client,
// and will probably be the hottest endpoint for us.
// 
// one additional note here: we've specifically decided _not_ to render
// this page with Edge because we'll _very likely_ get much faster output
// if we just serve the data direcyly with Fastify.
//
// optimization here is welcome.
server.get("/:owner/:name", async (request, reply) => {
	// set up our types for the expected parameters and handle issues with input URL
	const { owner, name } = request.params as { owner: string; name: string };
	request.log.info(`Received request for owner/name: ${owner}/${name}`);
	const errFuncInMarkdown = "~~owner/name not found~~"; // leverage Strikethrough() for non-existent packages, lol
	reply.header("Content-Type", "text/markdown");
	if (!owner || !name) return reply.status(404).send(errFuncInMarkdown);
	// do the actual work of this endpoint
	const libs = await dumbCacheGitHubResults(timeout, dir, cacheFile);;
	const fetchedLib = await getLibByOwnerAndName(owner, name, libs);
	if (fetchedLib !== undefined) {
		reply.code(200);
		return reply.send(fetchedLib.readme.content);
	}
	return reply.status(404).send(errFuncInMarkdown);
});

// this renders the pin URL, which specifically is the unique ID of
// a repository in GitHub - this helps allows for pinning on libraries
// if the origin repo moves around or gets renamed
server.get("/pin/:pin", async (request, reply) => {
	const libs = await dumbCacheGitHubResults(timeout, dir, cacheFile);
	const { pin } = request.params as { pin: string};
	request.log.info(`Received request for pin: ${pin}`);
	reply.header("Content-Type", "text/markdown");
	const errFuncInMarkdown = "~~pin not found~~"; // leverage Strikethrough() for non-existent packages, lol
	
	// check if there's actually a pin provided in the request
	if (!pin) {
		request.log.error(`No pin provided in request for /pin/:pin: ${pin}`);
		return reply.status(404).send(errFuncInMarkdown);
	}
	
	for (const lib in libs) {
		if (libs[lib].pin === pin) {
			reply.code(200);
			return reply.send(libs[lib].readme.content);
		}
	}
	request.log.error(`The pin doesn't exist in our data: ${pin}`);
	return reply.status(404).send(errFuncInMarkdown);
});


// this serves the library off of the SHA of the README, which is 
// a pretty decent way to ensure that you're using the exact content
// you expect as long as you don't think about what happens if there's an
// update too hard
server.get("/sha/:sha", async (request, reply) => {
	const libs = await dumbCacheGitHubResults(timeout, dir, cacheFile);
	const { sha } = request.params as { sha: string};
	request.log.info(`Received request for sha: ${sha}`);
	reply.header("Content-Type", "text/markdown");
	const errFuncInMarkdown = "~~sha not found~~"; // leverage Strikethrough() for non-existent packages, lol
	
	// check if there's actually a sha provided in the request
	if (!sha) {
		request.log.error(`No sha provided in request for /sha/:sha: ${sha}`);
		return reply.status(404).send(errFuncInMarkdown);
	}
	
	for (const lib in libs) {
		console.log(libs[lib].readme.sha, sha)
		if (libs[lib].readme.sha === sha) {
			reply.code(200);
			return reply.send(libs[lib].readme.content);
		}
	}
	request.log.error(`The sha doesn't exist in our data: ${sha}`);
	return reply.status(404).send(errFuncInMarkdown);
});


// basic healthcheck because it's what the cool kids do
server.get("/health", async (request) => {
	request.log.info("Received request for /health");
	return { status: "ok" };
});

// run the server!
server.listen({ port: 8080 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	server.log.info(`Server running at ${address}`);
});
