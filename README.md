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

### Choices

We're currently using the following stack:

- [Fastify](https://www.fastify.io/) for the server
- [Edge.js](https://edgejs.dev/) for templating

### Contributing

You're welcome to contribute. Contributions might not be merged, so if you're not sure if they're something we'd want to merge, please create an Issue first.

Features we're looking for:
- Blocklists (people will 100% spam us)
- Caching (we don't want to hit GitHub's API every time, it's really expensive right now)
- Rendering the README.md Markdown and displaying it on the library page
- A per-page view of each library, rather than the whole index
- A search function
- A way to filter by tags (e.g. "parser", "formatter", etc.)
- Leverage published git tags as a versioning system
- GitHub Enterprise support (so you can run this internally, Markdownlang Innersource is not far from reality)

