export default async function getLibByOwnerAndName(owner: string, name: string, libs: Record<string, any>) {
for (const lib in libs) {
		if (libs[lib].owner === owner && libs[lib].name === name) {
			return libs[lib];
		}
	}
	return undefined;
}