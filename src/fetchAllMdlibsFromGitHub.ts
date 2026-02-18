import { Octokit } from "octokit";

// set up Octokit. You _will_ need to provide a GITHUB_TOKEN in your 
// environment variables for this to work.
const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
});


// this is an Octokit request that we expect to call multiple times until the pagination
// has been exhausted. it will return all repositories tagged with the "mdlib" topic, 
// which is how we identify libraries to be included in the registry.
async function getReposThatMatchTemplates(): Promise<any> {
	const response = await octokit.rest.search.repos({
		q: "topic:mdlib",
		per_page: 100,
	});

	return response;
}

// this function is an Octokit request that we use to fetch specific repositories' README files,
// which we serve directly. Currently, we're doing this hot and it's not cached.
// if you want @bnb to call you a really cool person in README.md, you can add caching.
// TODO: add caching of the data this function fetches.
async function getREADMEFromMatchingTemplate(repo: any): Promise<any> {
	const query = await octokit.rest.repos.getContent({
		owner: repo.owner.login,
		repo: repo.name,
		path: "README.md",
	});


	// forgive me for my @ts-expect-error crimes
	const readme = {
		// @ts-expect-error
		sha: query.data.sha,
		// @ts-expect-error
		size: query.data.size,
		// @ts-expect-error
		url: query.data.html_url,
		// @ts-expect-error
		download: query.data.download_url,
		// @ts-expect-error
		encoding: query.data.encoding,
		// @ts-expect-error
		content: Buffer.from(query.data.content, "base64").toString("utf8"),
	};

	return readme;
}

// this function wraps the execution of getReposThatMatchTemplates() and getREADMEFromMatchingTemplate() 
// and processes the data into a format we can serve to the client. GitHub's names are ugly and @bnb wants
// a prettier API.
async function processRepositoryData(libs: Array<any>) {
	const data = {};

	for (const lib in libs) {
		if (libs[lib].fork === true) continue;

		const usefulData = {
			name: libs[lib].name,
			owner: libs[lib].owner.login,
			id: libs[lib].full_name,
			pin: Number(libs[lib].id).toString(), // use the id as a way to pin to the repo so they can't hot swap the repo from under you
			description: libs[lib].description,
			url: libs[lib].html_url,
			stargazers: libs[lib].stargazers_count,
			forks: libs[lib].forks_count,
			watchers: libs[lib].watchers_count,
			issues: libs[lib].open_issues_count,
			license: libs[lib].license?.spdx_id,
			readme: await getREADMEFromMatchingTemplate(libs[lib]),
			created: libs[lib].created_at,
			updated: libs[lib].updated_at,
			pushed: libs[lib].pushed_at,
			clone: libs[lib].clone_url,
			homepage: libs[lib].homepage,
			archived: libs[lib].archived,
			disabled: libs[lib].disabled,
			topics: libs[lib].topics,
		};

		// @ts-expect-error
		data[usefulData.id] = usefulData;
	}

	return data;
}

export default async function fetchAllMdlibsFromGitHub() {
	const existingData = {};
	const iterations = 0;

	const page = await getReposThatMatchTemplates();

	if (page.data.incomplete_results !== true) {
		if (page.data.items.length === 0) {
			return existingData;
		}

		const reposTaggedWithmdlib = page.data.items;

		const newData = await processRepositoryData(reposTaggedWithmdlib);

		Object.assign(existingData, newData);
		iterations + 1;
	}

	return existingData;
}

fetchAllMdlibsFromGitHub();
