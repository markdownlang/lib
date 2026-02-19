# lib

This is lib, the Markdownlang Public Library. It renders Markdownlang packages from GitHub repositories tagged `mdlib`. If you want your libraries to show up here, tag them and they'll show up.

## Development

To get started with development, run the following commands:

```bash
git clone git@github.com:markdownlang/lib.git
cd lib
npm install
npm run dev
```

## Production

Hey if you have suggestions, update this section.

### Deployment

You will need to set three environment variables:
- `GITHUB_TOKEN`: A basic GitHub Personal Access Token. No special scopes required.
- `CACHE_TIMEOUT`: The amount of time (in milliseconds) that cached GitHub results should be considered valid. Defaults to `1000*60*10` (10 minutes) if not set.
- `SITE_ROOT`: The root URL for the site. This is used for generating links to library pages. Defaults to `127.0.0.1:8080` if not set.
- `SITE_PROTOCOL`: The protocol for the site. `http` is default.

## Choices

We're currently using the following stack:

- [Node.js](https://nodejs.org/) for the runtime
- [TypeScript](https://www.typescriptlang.org/) for "type safety"
- [Fastify](https://www.fastify.io/) for the server
- [Edge.js](https://edgejs.dev/) for templating
- [Octokit](https://github.com/octokit/rest.js) for GitHub API interactions

## Contributing

You're welcome to contribute. Contributions might not be merged, so if you're not sure if they're something we'd want to merge, please create an Issue first.

Features we're looking for:
- [ ] Blocklists (people will 100% spam us)
- [x] Caching (we don't want to hit GitHub's API every time, it's really expensive right now)
	- A basic cache has been built and lives in [src/dumbCacheGitHubResults.ts](src/dumbCacheGitHubResults.ts), but it could almost cerntainly be better. If you want to make it better, please feel free to give it a shot.
- [ ] Rendering the README.md Markdown and displaying it on the library page
- [ ] A per-page view of each library, rather than the whole index
- [ ] A search function
- [ ] A way to filter by tags (e.g. "parser", "formatter", etc.)
- [ ] Leverage published git tags as a versioning system
- [ ] GitHub Enterprise support (so you can run this internally, Markdownlang Innersource is not far from reality)
- [ ]Fix @ts-expect-error comments
