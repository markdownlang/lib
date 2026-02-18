import fastify from "fastify";
import fastifyView from "@fastify/view";
import { Edge } from "edge.js";
import { join } from "node:path";
import fetchAllMdlibsFromGitHub from "./helpers/fetchAllMdlibsFromGitHub.js";

// fake data to make it work
const libs = await fetchAllMdlibsFromGitHub();
const server = fastify({ logger: true });

const edge = new Edge();
edge.mount(join(import.meta.dirname, "templates"));

server.register(fastifyView, {
	engine: {
		// @ts-expect-error
		edge: edge,
	},
});

server.get("/", async (request, reply) => {
	const data = {
		metadata: {
			title: "Markdownlang Libraries",
			description: "The Markdownlang Library Registry",
		},
		libs,
	};
	reply.view("index.edge", data);
	return reply;
});

server.get("/:owner/:name", (request, reply) => {
	const errFuncInMarkdown = "~~package not found~~"; // lol
	reply.header("Content-Type", "text/markdown");
	const { owner, name } = request.params as { owner: string; name: string };
	if (!owner || !name) return reply.status(404).send(errFuncInMarkdown);
	for (const lib in libs) {
		// @ts-expect-error
		if (libs[lib].owner === owner && libs[lib].name === name) {
			// @ts-expect-error
			return reply.send(libs[lib].readme.content);
		}
	}
	return reply;
});

server.get("/health", async (request, reply) => {
	return { status: "ok" };
});

server.listen({ port: 8080 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	console.log(`Server listening at ${address}`);
});
